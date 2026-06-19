#!/usr/bin/env node
/**
 * Ingest UK postcode centroids from open data into public.postcode_centroids.
 *
 * No external API. Accepts EITHER:
 *  - ONSPD / NSPL CSV (has a header with pcds + lat + long, WGS84), or
 *  - OS Code-Point Open CSV(s) (HEADERLESS: postcode, PQI, eastings, northings;
 *    converted to WGS84 here). Pass a single CSV or a directory of CSVs.
 *
 * Usage:
 *   SUPABASE_DB_URL=... node scripts/ingest-postcode-centroids.mjs <file-or-dir>
 */
import { createReadStream } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import pg from "pg";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/ingest-postcode-centroids.mjs <csv-file-or-dir>");
  process.exit(1);
}
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

// --- OSGB36 National Grid (E/N) -> WGS84 lat/long (mirror of src/lib/valuation/osgb.ts) ---
const A_AIRY = 6377563.396, B_AIRY = 6356256.909, F0 = 0.9996012717;
const LAT0 = (49 * Math.PI) / 180, LON0 = (-2 * Math.PI) / 180, E0 = 400000, N0 = -100000;
const A_WGS = 6378137.0, B_WGS = 6356752.3141;
const TX = 446.448, TY = -125.157, TZ = 542.06, S = 20.4894e-6;
const RX = (0.1502 / 3600) * (Math.PI / 180), RY = (0.247 / 3600) * (Math.PI / 180), RZ = (0.8421 / 3600) * (Math.PI / 180);

function osgb36ToWgs84(E, N) {
  const e2 = (A_AIRY * A_AIRY - B_AIRY * B_AIRY) / (A_AIRY * A_AIRY);
  const n = (A_AIRY - B_AIRY) / (A_AIRY + B_AIRY);
  let lat = LAT0, M = 0;
  do {
    lat = (N - N0 - M) / (A_AIRY * F0) + lat;
    const dL = lat - LAT0, sL = lat + LAT0;
    M = B_AIRY * F0 * ((1 + n + 1.25 * n * n + 1.25 * n ** 3) * dL
      - (3 * n + 3 * n * n + 2.625 * n ** 3) * Math.sin(dL) * Math.cos(sL)
      + (1.875 * n * n + 1.875 * n ** 3) * Math.sin(2 * dL) * Math.cos(2 * sL)
      - (35 / 24) * n ** 3 * Math.sin(3 * dL) * Math.cos(3 * sL));
  } while (Math.abs(N - N0 - M) >= 0.00001);
  const sinLat = Math.sin(lat);
  const nu = (A_AIRY * F0) / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = (A_AIRY * F0 * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;
  const tL = Math.tan(lat), t2 = tL * tL, t4 = t2 * t2, t6 = t4 * t2, sec = 1 / Math.cos(lat);
  const VII = tL / (2 * rho * nu);
  const VIII = (tL / (24 * rho * nu ** 3)) * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
  const IX = (tL / (720 * rho * nu ** 5)) * (61 + 90 * t2 + 45 * t4);
  const X = sec / nu, XI = (sec / (6 * nu ** 3)) * (nu / rho + 2 * t2);
  const XII = (sec / (120 * nu ** 5)) * (5 + 28 * t2 + 24 * t4);
  const XIIA = (sec / (5040 * nu ** 7)) * (61 + 662 * t2 + 1320 * t4 + 720 * t6);
  const dE = E - E0;
  const latA = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const lonA = LON0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;
  // geodetic(Airy) -> cartesian
  const ea = (A_AIRY * A_AIRY - B_AIRY * B_AIRY) / (A_AIRY * A_AIRY);
  const sA = Math.sin(latA), nuA = A_AIRY / Math.sqrt(1 - ea * sA * sA);
  const x0 = nuA * Math.cos(latA) * Math.cos(lonA);
  const y0 = nuA * Math.cos(latA) * Math.sin(lonA);
  const z0 = (1 - ea) * nuA * sA;
  // Helmert -> WGS84 cartesian
  const x = TX + (1 + S) * x0 - RZ * y0 + RY * z0;
  const y = TY + RZ * x0 + (1 + S) * y0 - RX * z0;
  const z = TZ - RY * x0 + RX * y0 + (1 + S) * z0;
  // cartesian -> geodetic(WGS84)
  const ew = (A_WGS * A_WGS - B_WGS * B_WGS) / (A_WGS * A_WGS);
  const p = Math.sqrt(x * x + y * y);
  let latW = Math.atan2(z, p * (1 - ew));
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(latW);
    const nuW = A_WGS / Math.sqrt(1 - ew * s * s);
    latW = Math.atan2(z + ew * nuW * s, p);
  }
  return { lat: (latW * 180) / Math.PI, lng: (Math.atan2(y, x) * 180) / Math.PI };
}

function normPostcode(raw) {
  const c = String(raw ?? "").toUpperCase().replace(/\s+/g, "");
  if (c.length < 5 || c.length > 7) return null;
  return `${c.slice(0, -3)} ${c.slice(-3)}`;
}
const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
function splitCsv(line) {
  return line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
}
function findCol(header, names) {
  for (const n of names) {
    const i = header.findIndex((h) => h.trim().toLowerCase() === n);
    if (i !== -1) return i;
  }
  return -1;
}

function listCsvFiles(p) {
  const st = statSync(p);
  if (st.isDirectory()) {
    const out = [];
    for (const entry of readdirSync(p)) {
      const full = join(p, entry);
      if (statSync(full).isDirectory()) out.push(...listCsvFiles(full));
      else if (/\.csv$/i.test(entry)) out.push(full);
    }
    return out;
  }
  return [p];
}

const pool = new pg.Pool({ connectionString, max: 4 });
const BATCH = 1000;

async function upsert(batch) {
  if (!batch.length) return;
  const values = [];
  const params = [];
  batch.forEach((r, i) => {
    const b = i * 3;
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}, '${r.src}')`);
    params.push(r.postcode, r.lat, r.lng);
  });
  await pool.query(
    `INSERT INTO public.postcode_centroids (postcode, latitude, longitude, source)
     VALUES ${values.join(",")}
     ON CONFLICT (postcode) DO UPDATE
       SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           source = EXCLUDED.source, updated_at = NOW()`,
    params,
  );
}

async function ingestFile(file, totals) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let mode = null; // 'onspd' | 'codepoint'
  let pcIdx = -1, latIdx = -1, lngIdx = -1, eIdx = 2, nIdx = 3;
  let batch = [];
  let first = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = splitCsv(line);
    if (first) {
      first = false;
      if (POSTCODE_RE.test(cols[0] ?? "")) {
        // headerless OS Code-Point Open: postcode, PQI, eastings, northings
        mode = "codepoint";
      } else {
        mode = "onspd";
        pcIdx = findCol(cols, ["pcds", "postcode", "pcd"]);
        latIdx = findCol(cols, ["lat", "latitude"]);
        lngIdx = findCol(cols, ["long", "longitude", "lng"]);
        if (pcIdx === -1 || latIdx === -1 || lngIdx === -1) {
          console.error(`${file}: could not detect ONSPD columns. Header: ${cols.slice(0, 6).join(", ")}`);
          return;
        }
        continue; // skip header row
      }
    }

    let postcode, lat, lng;
    if (mode === "codepoint") {
      postcode = normPostcode(cols[0]);
      const E = Number(cols[eIdx]);
      const N = Number(cols[nIdx]);
      if (!postcode || !Number.isFinite(E) || !Number.isFinite(N) || E === 0) {
        totals.skipped++;
        continue;
      }
      ({ lat, lng } = osgb36ToWgs84(E, N));
    } else {
      postcode = normPostcode(cols[pcIdx]);
      lat = Number(cols[latIdx]);
      lng = Number(cols[lngIdx]);
    }
    if (!postcode || !Number.isFinite(lat) || !Number.isFinite(lng) || lat > 61 || lat < 49) {
      totals.skipped++;
      continue;
    }
    batch.push({ postcode, lat, lng, src: mode });
    if (batch.length >= BATCH) {
      await upsert(batch);
      totals.total += batch.length;
      batch = [];
    }
  }
  await upsert(batch);
  totals.total += batch.length;
}

async function main() {
  const files = listCsvFiles(target);
  console.log(`Ingesting ${files.length} CSV file(s)…`);
  const totals = { total: 0, skipped: 0 };
  for (const f of files) {
    await ingestFile(f, totals);
    if (files.length > 1) console.log(`  ${f.split("/").pop()} -> ${totals.total.toLocaleString()} so far`);
  }
  console.log(`Done. Upserted ${totals.total.toLocaleString()} centroids, skipped ${totals.skipped.toLocaleString()}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
