/**
 * scripts/seed-market-map-fixture.mjs
 *
 * Loads a small, deterministic market-map fixture into Supabase so the
 * multi-resolution choropleth, search, and flat/house breakdown work
 * end-to-end WITHOUT the full national HMLR/ONS ingest.
 *
 * This is NOT national data. It is a hand-built fixture using fictional "ZZ"
 * postcodes (clearly not real UK postcodes) placed over London so the basemap
 * renders land. Use it for local demo and DB contract tests; replace with the
 * real ingest (ingest-onspd / ingest-ons-boundaries / HMLR PPD) for production.
 *
 * Idempotent: every fixture row is keyed under the 'ZZ' / 'FIXTURE-' namespace
 * and is deleted before re-insert.
 *
 * Usage (reads SUPABASE_DB_URL from env or .env.local, like the ingest scripts):
 *   node scripts/seed-market-map-fixture.mjs            # seed
 *   node scripts/seed-market-map-fixture.mjs --clean    # remove fixture only
 *
 * Geography hierarchy seeded:
 *   LA ZZL01 "Northgate"  ─┬─ district ZZ1A / sector "ZZ1A 1" / MSOA ZZM01 / LSOA ZZS01  (High)
 *                          └─ district ZZ1B / sector "ZZ1B 2" / MSOA ZZM02 / LSOA ZZS02  (Low/Med)
 *   LA ZZL02 "Southmere"  ─┬─ district ZZ2A / sector "ZZ2A 1" / MSOA ZZM03 / LSOA ZZS03  (Medium)
 *                          └─ district ZZ2B / sector "ZZ2B 1" / MSOA ZZM04 / LSOA ZZS04  (Insufficient)
 *
 * Flat vs house medians differ per group so the breakdown is visibly distinct.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CLEAN_ONLY = process.argv.includes("--clean");

function loadDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.split("#")[0].trim();
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1 || line.slice(0, i).trim() !== "SUPABASE_DB_URL") continue;
    return line.slice(i + 1).trim().replace(/^["']|["']$/g, "").split("#")[0].trim().replace(/\s+.*$/, "");
  }
  return "";
}
const CA = readFileSync(resolve(SCRIPT_DIR, "certs", "supabase-prod-ca-2021.crt"), "utf8");

// House property-type codes cycled across house sales. Flats are always 'F'.
const HOUSE_TYPES = ["D", "S", "T"];

// Each group: a single (lad, district, sector, msoa, lsoa) with its own centre
// and flat/house counts + target medians (in pounds).
const GROUPS = [
  { lad_cd: "ZZL01", lad_name: "Northgate", district: "ZZ1A", sector: "ZZ1A 1", msoa: "ZZM01", lsoa: "ZZS01",
    msoaName: "Northgate Central", lsoaName: "Northgate Central A", town: "Northgate", street: "Central Avenue",
    lat: 51.5550, lng: -0.1200, flats: 30, flatMedian: 300_000, houses: 30, houseMedian: 600_000 },
  { lad_cd: "ZZL01", lad_name: "Northgate", district: "ZZ1B", sector: "ZZ1B 2", msoa: "ZZM02", lsoa: "ZZS02",
    msoaName: "Northgate East", lsoaName: "Northgate East A", town: "Northgate", street: "Eastern Road",
    lat: 51.5600, lng: -0.1000, flats: 9, flatMedian: 280_000, houses: 9, houseMedian: 520_000 },
  { lad_cd: "ZZL02", lad_name: "Southmere", district: "ZZ2A", sector: "ZZ2A 1", msoa: "ZZM03", lsoa: "ZZS03",
    msoaName: "Southmere West", lsoaName: "Southmere West A", town: "Southmere", street: "Western Way",
    lat: 51.4800, lng: -0.1000, flats: 12, flatMedian: 220_000, houses: 12, houseMedian: 450_000 },
  { lad_cd: "ZZL02", lad_name: "Southmere", district: "ZZ2B", sector: "ZZ2B 1", msoa: "ZZM04", lsoa: "ZZS04",
    msoaName: "Southmere Edge", lsoaName: "Southmere Edge A", town: "Southmere", street: "Edge Lane",
    lat: 51.4700, lng: -0.0800, flats: 0, flatMedian: 0, houses: 2, houseMedian: 400_000 },
];

// Deterministic symmetric price sequence around a median (exact median for any n).
function pricesAround(median, n, step = 5000) {
  const out = [];
  for (let i = 0; i < n; i++) out.push((median + step * (i - (n - 1) / 2)) * 100); // pence
  return out;
}

// 6 postcodes per group; transactions round-robin across them.
function postcodesFor(g) {
  const inwardDigit = g.sector.slice(-1);
  const letters = ["AA", "AB", "AD", "AE", "AF", "AG"];
  return letters.map((l) => ({
    normalised: `${g.district}${inwardDigit}${l}`,
    display: `${g.district} ${inwardDigit}${l}`,
  }));
}

function txDate(i) {
  const month = String((i % 12) + 1).padStart(2, "0");
  return `2025-${month}-15`;
}

async function main() {
  const client = new pg.Client({ connectionString: loadDbUrl(), ssl: { ca: CA } });
  await client.connect();
  try {
    await client.query("begin");

    // Idempotent clean (fixture namespace only)
    await client.query("delete from public.ppd_transactions where ppd_tuid like 'FIXTURE-%'");
    await client.query("delete from public.postcode_geography where postcode_normalised like 'ZZ%'");
    await client.query("delete from public.geography_boundaries where area_id like 'ZZ%'");

    if (CLEAN_ONLY) {
      await client.query("commit");
      console.log("Fixture removed.");
      return;
    }

    const boundaries = new Map(); // `${level}|${area_id}` -> { level, area_id, name, displayName, lats[], lngs[] }
    function addBoundaryPoint(level, area_id, name, lat, lng, displayName = null) {
      const key = `${level}|${area_id}`;
      if (!boundaries.has(key))
        boundaries.set(key, { level, area_id, name, displayName, lats: [], lngs: [] });
      const b = boundaries.get(key);
      b.lats.push(lat);
      b.lngs.push(lng);
    }

    let txId = 0;
    for (const g of GROUPS) {
      const pcs = postcodesFor(g);

      // postcode_geography rows
      for (const pc of pcs) {
        await client.query(
          `insert into public.postcode_geography
             (postcode_normalised, postcode_display, latitude, longitude,
              lsoa_cd, msoa_cd, lad_cd, lad_name, postcode_area, postcode_district,
              postcode_sector, coordinates)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                   ST_SetSRID(ST_MakePoint($4,$3),4326)::geography)`,
          [pc.normalised, pc.display, g.lat, g.lng, g.lsoa, g.msoa, g.lad_cd, g.lad_name,
           g.district.replace(/[0-9].*$/, ""), g.district, g.sector],
        );
      }

      // Transactions: flats ('F') then houses (D/S/T)
      const flatPrices = pricesAround(g.flatMedian, g.flats);
      const housePrices = pricesAround(g.houseMedian, g.houses);
      const rows = [
        ...flatPrices.map((p, i) => ({ price: p, type: "F", i })),
        ...housePrices.map((p, i) => ({ price: p, type: HOUSE_TYPES[i % HOUSE_TYPES.length], i })),
      ];
      for (const r of rows) {
        const pc = pcs[txId % pcs.length];
        await client.query(
          `insert into public.ppd_transactions
             (ppd_tuid, price_pence, transfer_date, postcode, property_type,
              new_build, tenure, street, town, ppd_category, last_record_status)
           values ($1,$2,$3,$4,$5,false,'F',$6,$7,'A','A')`,
          [`FIXTURE-${String(txId).padStart(5, "0")}`, r.price, txDate(txId),
           pc.display, r.type, g.street, g.town],
        );
        txId++;
      }

      // Collect boundary extents for each level this group contributes to
      addBoundaryPoint("local_authority", g.lad_cd, g.lad_name, g.lat, g.lng);
      addBoundaryPoint("postcode_district", g.district, g.district, g.lat, g.lng);
      addBoundaryPoint("postcode_sector", g.sector, g.sector, g.lat, g.lng);
      // MSOA/LSOA carry a human "<district> · <borough>" display_name, mirroring
      // the 20260624180000 backfill (so contract tests see the same shape).
      addBoundaryPoint("msoa", g.msoa, g.msoaName, g.lat, g.lng, `${g.district} · ${g.lad_name}`);
      addBoundaryPoint("lsoa", g.lsoa, g.lsoaName, g.lat, g.lng, `${g.district} · ${g.lad_name}`);
    }

    // Per-level box half-widths (degrees) — coarser levels get bigger boxes.
    const HALF = { local_authority: 0.05, postcode_district: 0.025, postcode_sector: 0.02, msoa: 0.018, lsoa: 0.01 };
    for (const b of boundaries.values()) {
      const cLat = b.lats.reduce((a, v) => a + v, 0) / b.lats.length;
      const cLng = b.lngs.reduce((a, v) => a + v, 0) / b.lngs.length;
      const h = HALF[b.level];
      await client.query(
        `insert into public.geography_boundaries (level, area_id, area_name, display_name, geometry)
         values ($1,$2,$3,$4,
           ST_Multi(ST_MakeEnvelope($5,$6,$7,$8,4326)))`,
        [b.level, b.area_id, b.name, b.displayName, cLng - h, cLat - h, cLng + h, cLat + h],
      );
    }

    await client.query("commit");

    const counts = await client.query(`
      select
        (select count(*) from public.ppd_transactions where ppd_tuid like 'FIXTURE-%') as ppd,
        (select count(*) from public.postcode_geography where postcode_normalised like 'ZZ%') as pc,
        (select count(*) from public.geography_boundaries where area_id like 'ZZ%') as bound`);
    console.log("Seeded:", counts.rows[0]);

    // Sanity: aggregate at LA level
    const agg = await client.query(
      `select area_id, area_name, median_price_pence, transaction_count
         from public.market_map_aggregate('local_authority','all')`);
    console.log("LA aggregate:");
    console.table(agg.rows);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
