/**
 * scripts/ingest-onspd.mjs
 *
 * Populates public.postcode_geography from the ONS Postcode Directory (ONSPD).
 *
 * Source:
 *   ONS Open Geography Portal — https://geoportal.statistics.gov.uk/
 *   Product: "ONS Postcode Directory (ONSPD)"
 *   Licence: Open Government Licence v3.0 (OGL)
 *   Format: ZIP containing a /Data/ folder with one large CSV (~1 GB zipped,
 *           ~1.7 million rows for Great Britain + Northern Ireland).
 *   Download: search "ONSPD" on the portal, select the latest November or May
 *             release, and download the "CSV" asset. Extract the CSV before
 *             running this script.
 *
 * Usage:
 *   node scripts/ingest-onspd.mjs                           # dry run
 *   node scripts/ingest-onspd.mjs --commit                  # write to DB
 *   node scripts/ingest-onspd.mjs --csv=/path/to/ONSPD.csv  # explicit path
 *   ONSPD_CSV=/path/to/ONSPD.csv node scripts/ingest-onspd.mjs --commit
 *
 * Reads SUPABASE_DB_URL from environment or .env.local (same loader as other
 * ingest scripts). Streams the CSV — does NOT load 1.7M rows into memory.
 * Upserts in batches of BATCH_SIZE on conflict(postcode_normalised).
 *
 * ONSPD column notes (column names vary between releases — mapped
 * case-insensitively):
 *   pcds        formatted postcode (e.g. "SW1A 1AA")
 *   pcd         8-char postcode (space-padded)  — fallback if pcds absent
 *   lat         latitude   (99.999999 = terminated/no-coords → store as null)
 *   long        longitude  (0.0 paired with lat=99.999999 → store as null)
 *   oa21/oa11   census output area (prefer 2021 if present)
 *   lsoa21/lsoa11  LSOA code (prefer 2021)
 *   msoa21/msoa11  MSOA code (prefer 2021)
 *   oslaua      local authority district code (lad_cd)
 *   osward      ward code
 *   rgn         region code/name (ONSPD stores the region code; name lookup
 *               is not done here — the region column holds the raw code)
 *
 * lad_name is left NULL by this script. The ingest-ons-boundaries.mjs script
 * backfills it from the LAD GeoJSON (which carries human-readable names).
 */

import { createReadStream, readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import proj4 from "proj4";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const COMMIT = process.argv.includes("--commit");
const CSV_ARG_IDX = process.argv.findIndex((a) => a.startsWith("--csv="));
const CSV_ARG = CSV_ARG_IDX !== -1 ? process.argv[CSV_ARG_IDX].slice(6) : null;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const BATCH_SIZE = 2000;
const LOG_EVERY = 100_000;

// Sentinel value ONSPD uses for postcodes with no coordinates (terminated etc.)
const LAT_NO_COORDS = 99.999999;

// ---------------------------------------------------------------------------
// Coordinate systems.
//
// ONSPD ships WGS84 lat/long directly. NSPL / NSP21CL ship OSGB36 British
// National Grid eastings/northings (oseast1m / osnrth1m) instead, which must
// be reprojected to WGS84 before storage (coordinates column is SRID 4326).
//
// EPSG:27700 definition includes the +towgs84 Helmert params so the transform
// lands within ~1 m of the OSGB datum-shift truth — ample for postcode
// centroids. NSPL sentinel for "no grid ref" (e.g. terminated/NI postcodes
// without a 1m grid) is easting/northing = 0.
// ---------------------------------------------------------------------------

const OSGB36 =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 " +
  "+y_0=-100000 +ellps=airy " +
  "+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 " +
  "+units=m +no_defs";
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";
const osgbToWgs84 = proj4(OSGB36, WGS84);

// Returns { lat, lng } in WGS84, or null when the grid ref is the sentinel /
// out of plausible GB bounds.
function eastingNorthingToLatLng(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  if (easting === 0 && northing === 0) return null;
  const [lng, lat] = osgbToWgs84.forward([easting, northing]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // GB bounding box sanity check (excludes garbage rows).
  if (lat < 49 || lat > 61 || lng < -9 || lng > 2) return null;
  return { lat, lng };
}

// ---------------------------------------------------------------------------
// Postcode normalisation — mirrors src/lib/market-map/postcode.ts exactly.
//
// joinKey  = uppercase, no spaces, e.g. "SW1A1AA"
// display  = canonical "outward inward", e.g. "SW1A 1AA"
// area     = leading alpha prefix, 1-2 letters, e.g. "SW"
// district = outward code, e.g. "SW1A"
// sector   = district + space + first inward char, e.g. "SW1A 1"
// ---------------------------------------------------------------------------

const UK_POSTCODE_RE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/;

function normalisePostcode(raw) {
  if (raw == null) return null;
  const cleaned = raw.toUpperCase().trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  const compact = cleaned.replace(/\s/g, "");
  const match = UK_POSTCODE_RE.exec(compact);
  if (!match) return null;
  const district = match[1];
  const inward = match[2];
  const joinKey = district + inward;
  const display = `${district} ${inward}`;
  const areaMatch = /^[A-Z]+/.exec(district);
  const area = areaMatch[0];
  const sector = `${district} ${inward[0]}`;
  return { joinKey, display, area, district, sector };
}

// ---------------------------------------------------------------------------
// Env + TLS (same pattern as ingest-naptan.mjs / ingest-ofcom-broadband.mjs)
// ---------------------------------------------------------------------------

function loadDbUrl() {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL.split("#")[0].trim();
  }
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i === -1 || line.slice(0, i).trim() !== "SUPABASE_DB_URL") continue;
      return line
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
        .split("#")[0]
        .trim()
        .replace(/\s+.*$/, "");
    }
  } catch {
    /* ignore — env file may not exist */
  }
  return "";
}

function loadCaCert() {
  const caPath =
    process.env.PGSSLROOTCERT ||
    resolve(SCRIPT_DIR, "certs", "supabase-prod-ca-2021.crt");
  return readFileSync(caPath, "utf8");
}

// ---------------------------------------------------------------------------
// CSV header mapping (case-insensitive, handles release-to-release variation)
// ---------------------------------------------------------------------------

/**
 * Returns an object mapping our logical column names to their 0-based index
 * in the parsed ONSPD header row.
 *
 * We prefer 2021 census codes (oa21, lsoa21, msoa21) and fall back to 2011
 * variants (oa11, lsoa11, msoa11) for older releases.
 */
function buildColMap(headers) {
  const h = headers.map((s) => s.toLowerCase().trim());
  const idx = (name) => h.indexOf(name);
  // First matching column among candidates (handles release + product variation:
  // ONSPD uses bare codes/lat/long; NSPL/NSP21CL uses *cd suffixes + grid refs).
  const first = (...names) => {
    for (const n of names) {
      const i = idx(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  // Postcode columns — pcds is the formatted display form; pcd is fixed-width
  const pcdsCol = first("pcds", "pcd2", "pcd", "pcd7", "pcd8");

  // Census codes — prefer 2021, fall back to 2011; accept both bare (ONSPD)
  // and *cd-suffixed (NSPL) header spellings.
  const oaCol   = first("oa21", "oa21cd", "oa11", "oa11cd");
  const lsoaCol = first("lsoa21", "lsoa21cd", "lsoa11", "lsoa11cd");
  const msoaCol = first("msoa21", "msoa21cd", "msoa11", "msoa11cd");

  // Coordinate format: ONSPD ships WGS84 lat/long; NSPL ships OSGB36 grid refs.
  const latCol  = first("lat");
  const longCol = first("long");
  const eastCol = first("oseast1m", "oseast100m", "gridgb1e");
  const northCol = first("osnrth1m", "osnrth100m", "gridgb1n");

  return {
    pcds:   pcdsCol,
    lat:    latCol,
    long:   longCol,
    east:   eastCol,
    north:  northCol,
    // "latlong" when WGS84 columns present, else "gridref" (reproject required)
    coordFormat: latCol !== -1 && longCol !== -1 ? "latlong" : "gridref",
    oa:     oaCol,
    lsoa:   lsoaCol,
    msoa:   msoaCol,
    lad:    first("oslaua", "ladcd"),
    ward:   first("osward", "wardcd"),
    rgn:    first("rgn", "rgncd"),
  };
}

// ---------------------------------------------------------------------------
// Minimal RFC-4180 CSV splitter (same approach as ingest-naptan.mjs)
// ---------------------------------------------------------------------------

function splitCsvLine(line) {
  if (line.indexOf('"') === -1) return line.split(",");
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// ---------------------------------------------------------------------------
// Upsert batch
// ---------------------------------------------------------------------------

async function upsertBatch(client, rows) {
  if (rows.length === 0) return;
  const params = [];
  const valueClauses = rows.map((r, i) => {
    const b = i * 13;
    // coords: null when ONSPD sentinel detected
    const coordsExpr = r.lat != null
      ? `st_setsrid(st_makepoint($${b + 4}, $${b + 3}), 4326)::geography`
      : `null`;
    params.push(
      r.postcode_normalised,  // $b+1
      r.postcode_display,     // $b+2
      r.lat,                  // $b+3
      r.lng,                  // $b+4
      r.lsoa_cd,              // $b+5
      r.msoa_cd,              // $b+6
      r.lad_cd,               // $b+7
      r.ward_cd,              // $b+8
      r.region,               // $b+9
      r.postcode_area,        // $b+10
      r.postcode_district,    // $b+11
      r.postcode_sector,      // $b+12
      r.output_area,          // $b+13
    );
    // Note: lad_name ($b+14) is not in the param array — we omit it from the
    // INSERT because ONSPD does not carry LAD names. The boundaries ingest
    // backfills it. We use 13 bound params per row; coordsExpr is inline SQL.
    return (
      `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, ` +
      `${coordsExpr}, ` +
      `$${b + 5}, $${b + 6}, $${b + 7}, null, $${b + 8}, $${b + 9}, ` +
      `$${b + 10}, $${b + 11}, $${b + 12}, $${b + 13})`
    );
  });

  await client.query(
    `insert into public.postcode_geography (
       postcode_normalised, postcode_display, latitude, longitude,
       coordinates,
       lsoa_cd, msoa_cd, lad_cd, lad_name, ward_cd, region,
       postcode_area, postcode_district, postcode_sector, output_area
     )
     values ${valueClauses.join(", ")}
     on conflict (postcode_normalised) do update set
       postcode_display     = excluded.postcode_display,
       latitude             = excluded.latitude,
       longitude            = excluded.longitude,
       coordinates          = excluded.coordinates,
       lsoa_cd              = excluded.lsoa_cd,
       msoa_cd              = excluded.msoa_cd,
       lad_cd               = excluded.lad_cd,
       ward_cd              = excluded.ward_cd,
       region               = excluded.region,
       postcode_area        = excluded.postcode_area,
       postcode_district    = excluded.postcode_district,
       postcode_sector      = excluded.postcode_sector,
       output_area          = excluded.output_area,
       updated_at           = now()`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // --- resolve CSV path ---
  const csvPath = CSV_ARG
    || process.env.ONSPD_CSV
    || null;

  if (!csvPath) {
    console.error(
      "[onspd] ERROR: No CSV path provided.\n" +
      "\n" +
      "  Download the ONS Postcode Directory (ONSPD) from:\n" +
      "    https://geoportal.statistics.gov.uk/\n" +
      "  Search for 'ONS Postcode Directory' — choose the latest May or\n" +
      "  November release. Download the CSV asset (~1 GB zipped), extract\n" +
      "  the ZIP, and pass the extracted .csv file path:\n" +
      "\n" +
      "    node scripts/ingest-onspd.mjs --csv=/path/to/ONSPD_Nov24_UK.csv\n" +
      "  or:\n" +
      "    ONSPD_CSV=/path/to/ONSPD_Nov24_UK.csv node scripts/ingest-onspd.mjs\n",
    );
    process.exit(1);
  }

  const resolvedCsv = resolve(csvPath);
  if (!existsSync(resolvedCsv)) {
    console.error(`[onspd] ERROR: CSV not found at: ${resolvedCsv}`);
    process.exit(1);
  }

  // --- resolve DB URL ---
  const dbUrl = loadDbUrl();
  if (!dbUrl) {
    console.error(
      "[onspd] ERROR: SUPABASE_DB_URL not set.\n" +
      "  Add it to .env.local or pass it as an environment variable.\n" +
      "  Use the Session pooler on port 5432.\n",
    );
    process.exit(1);
  }

  console.log(`[onspd] CSV       : ${resolvedCsv}`);
  console.log(`[onspd] Target DB : ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`[onspd] Mode      : ${COMMIT ? "COMMIT" : "DRY RUN (pass --commit to write)"}`);

  // --- connect (only when committing) ---
  let client = null;
  if (COMMIT) {
    client = new pg.Client({
      connectionString: dbUrl,
      ssl: { ca: loadCaCert(), rejectUnauthorized: true },
    });
    await client.connect();
    console.log("[onspd] DB connected.");
  }

  // --- stream + parse ---
  let colMap = null;
  let batch = [];
  let rowsRead = 0;
  let rowsUpserted = 0;
  let rowsSkipped = 0;

  const rl = createInterface({
    input: createReadStream(resolvedCsv),
    crlfDelay: Infinity,
  });

  const flushBatch = async () => {
    if (batch.length === 0) return;
    if (COMMIT) {
      try {
        await upsertBatch(client, batch);
        rowsUpserted += batch.length;
      } catch (err) {
        console.warn(`[onspd] WARN: batch upsert failed: ${err.message}`);
        rowsSkipped += batch.length;
      }
    } else {
      rowsUpserted += batch.length; // dry-run: count as "would upsert"
    }
    batch = [];
  };

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "");
    if (!line) continue;

    // --- header row ---
    if (colMap === null) {
      const headers = splitCsvLine(line);
      colMap = buildColMap(headers);
      if (colMap.pcds === -1) {
        console.error(
          "[onspd] ERROR: Could not find postcode column (pcds/pcd2/pcd) in CSV header.\n" +
          `         Detected headers (first 10): ${headers.slice(0, 10).join(", ")}\n`,
        );
        if (client) await client.end();
        process.exit(1);
      }
      const hasLatLong = colMap.lat !== -1 && colMap.long !== -1;
      const hasGridRef = colMap.east !== -1 && colMap.north !== -1;
      if (!hasLatLong && !hasGridRef) {
        console.error(
          "[onspd] ERROR: Could not find coordinate columns — need either " +
          "lat/long (ONSPD) or oseast1m/osnrth1m (NSPL/NSP21CL).\n" +
          `         Detected headers (first 12): ${headers.slice(0, 12).join(", ")}\n`,
        );
        if (client) await client.end();
        process.exit(1);
      }
      console.log(
        `[onspd] Header mapped — postcode idx: ${colMap.pcds}, ` +
        `coords: ${colMap.coordFormat} ` +
        `(${colMap.coordFormat === "latlong"
          ? `lat ${colMap.lat}/long ${colMap.long}`
          : `east ${colMap.east}/north ${colMap.north} → reproject OSGB36→WGS84`}), ` +
        `lsoa: ${colMap.lsoa}, msoa: ${colMap.msoa}, lad: ${colMap.lad}`,
      );
      continue;
    }

    rowsRead++;

    // --- progress ---
    if (rowsRead % LOG_EVERY === 0) {
      console.log(
        `[onspd] Progress  : ${rowsRead.toLocaleString("en-GB")} rows read, ` +
        `${rowsUpserted.toLocaleString("en-GB")} upserted, ` +
        `${rowsSkipped.toLocaleString("en-GB")} skipped`,
      );
    }

    let fields;
    try {
      fields = splitCsvLine(line);
    } catch {
      rowsSkipped++;
      continue;
    }

    // --- raw postcode ---
    const rawPc = (fields[colMap.pcds] || "").trim();
    if (!rawPc) {
      rowsSkipped++;
      continue;
    }

    const pc = normalisePostcode(rawPc);
    if (!pc) {
      // Malformed — warn at low volume to avoid log spam on large files
      if (rowsSkipped < 20) {
        console.warn(`[onspd] WARN: malformed postcode "${rawPc}" — skipped`);
      }
      rowsSkipped++;
      continue;
    }

    // --- coordinates ---
    // ONSPD: WGS84 lat/long, sentinel lat=99.999999 for no-coords.
    // NSPL/NSP21CL: OSGB36 eastings/northings, sentinel 0/0 → reproject.
    let lat = null;
    let lng = null;
    if (colMap.coordFormat === "latlong") {
      const rawLat = parseFloat(fields[colMap.lat] || "");
      const rawLng = parseFloat(fields[colMap.long] || "");
      const hasCoords =
        Number.isFinite(rawLat) &&
        Number.isFinite(rawLng) &&
        Math.abs(rawLat - LAT_NO_COORDS) > 0.0001;
      lat = hasCoords ? rawLat : null;
      lng = hasCoords ? rawLng : null;
    } else {
      const east = parseFloat(fields[colMap.east] || "");
      const north = parseFloat(fields[colMap.north] || "");
      const wgs = eastingNorthingToLatLng(east, north);
      if (wgs) {
        lat = wgs.lat;
        lng = wgs.lng;
      }
    }

    // --- other geography codes ---
    const g = (col) => (col !== -1 ? (fields[col] || "").trim() || null : null);

    batch.push({
      postcode_normalised: pc.joinKey,
      postcode_display:    pc.display,
      lat,
      lng,
      lsoa_cd:             g(colMap.lsoa),
      msoa_cd:             g(colMap.msoa),
      lad_cd:              g(colMap.lad),
      ward_cd:             g(colMap.ward),
      region:              g(colMap.rgn),
      postcode_area:       pc.area,
      postcode_district:   pc.district,
      postcode_sector:     pc.sector,
      output_area:         g(colMap.oa),
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }

  // flush remainder
  await flushBatch();

  if (client) {
    const { rows } = await client.query(
      "select count(*)::bigint as total from public.postcode_geography",
    );
    console.log(
      `[onspd] postcode_geography now holds: ${Number(rows[0].total).toLocaleString("en-GB")} rows`,
    );
    await client.end();
  }

  const verb = COMMIT ? "upserted" : "would upsert";
  console.log(
    `[onspd] Done. rows read: ${rowsRead.toLocaleString("en-GB")}, ` +
    `${verb}: ${rowsUpserted.toLocaleString("en-GB")}, ` +
    `skipped: ${rowsSkipped.toLocaleString("en-GB")}`,
  );
  if (!COMMIT) {
    console.log("[onspd] Dry run — no writes. Pass --commit to ingest.");
  }
}

main().catch((err) => {
  console.error("[onspd] FATAL:", err.message);
  process.exit(1);
});
