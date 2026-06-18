#!/usr/bin/env node
/**
 * Ingest UK postcode centroids from open data into public.postcode_centroids.
 *
 * Accepts a CSV download (no external API): ONS Postcode Directory (ONSPD) or
 * NSPL, which carry WGS84 lat/long columns. Column names are auto-detected
 * (postcode|pcds|pcd, lat|latitude, long|longitude). OS Code-Point Open users
 * should use ONSPD/NSPL (WGS84) or convert eastings/northings first.
 *
 * Usage:
 *   SUPABASE_DB_URL=... node scripts/ingest-postcode-centroids.mjs path/to/onspd.csv
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/ingest-postcode-centroids.mjs <csv-file>");
  process.exit(1);
}
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

function normPostcode(raw) {
  const c = String(raw ?? "").toUpperCase().replace(/\s+/g, "");
  if (c.length < 5 || c.length > 7) return null;
  return `${c.slice(0, -3)} ${c.slice(-3)}`;
}

function findCol(header, names) {
  for (const n of names) {
    const i = header.findIndex((h) => h.trim().toLowerCase() === n);
    if (i !== -1) return i;
  }
  return -1;
}

function splitCsv(line) {
  // ONSPD/NSPL are simple comma CSVs, occasionally quoted.
  return line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
}

const pool = new pg.Pool({ connectionString, max: 4 });
const BATCH = 1000;

async function upsert(batch) {
  if (!batch.length) return;
  const values = [];
  const params = [];
  batch.forEach((row, i) => {
    const base = i * 3;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, 'onspd')`);
    params.push(row.postcode, row.lat, row.lng);
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

async function main() {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let header = null;
  let pcIdx = -1;
  let latIdx = -1;
  let lngIdx = -1;
  let batch = [];
  let total = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = splitCsv(line);
    if (!header) {
      header = cols;
      pcIdx = findCol(header, ["pcds", "postcode", "pcd"]);
      latIdx = findCol(header, ["lat", "latitude"]);
      lngIdx = findCol(header, ["long", "longitude", "lng"]);
      if (pcIdx === -1 || latIdx === -1 || lngIdx === -1) {
        console.error(`Could not detect columns. Header: ${header.join(", ")}`);
        process.exit(1);
      }
      console.log(`Columns -> postcode:${pcIdx} lat:${latIdx} lng:${lngIdx}`);
      continue;
    }
    const postcode = normPostcode(cols[pcIdx]);
    const lat = Number(cols[latIdx]);
    const lng = Number(cols[lngIdx]);
    // ONSPD uses 99.999999 for terminated / no-grid postcodes; skip those.
    if (!postcode || !Number.isFinite(lat) || !Number.isFinite(lng) || lat > 61 || lat < 49) {
      skipped++;
      continue;
    }
    batch.push({ postcode, lat, lng });
    if (batch.length >= BATCH) {
      await upsert(batch);
      total += batch.length;
      batch = [];
      if (total % 50000 === 0) console.log(`  ${total.toLocaleString()} upserted…`);
    }
  }
  await upsert(batch);
  total += batch.length;
  console.log(`Done. Upserted ${total.toLocaleString()} centroids, skipped ${skipped.toLocaleString()}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
