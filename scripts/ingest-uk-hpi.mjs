#!/usr/bin/env node
/**
 * Ingest the gov.uk UK House Price Index "full file" into public.hpi_index.
 *
 * Free, downloadable open data (OGL) — no external API. Stores the monthly index
 * per area, including per-property-type indices, so the AVM can time-adjust
 * comparable sales by area + type.
 *
 * Usage:
 *   SUPABASE_DB_URL=... node scripts/ingest-uk-hpi.mjs ~/Downloads/UK-HPI-full-file-2026-04.csv
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/ingest-uk-hpi.mjs <UK-HPI-full-file.csv>");
  process.exit(1);
}
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

function findCol(header, name) {
  const i = header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  return i;
}

function toMonth(ddmmyyyy) {
  // UK HPI dates are DD/MM/YYYY.
  const m = String(ddmmyyyy ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}`;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const pool = new pg.Pool({ connectionString, max: 4 });
const BATCH = 1000;

async function upsert(batch) {
  if (!batch.length) return;
  const values = [];
  const params = [];
  batch.forEach((r, i) => {
    const b = i * 8;
    values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`);
    params.push(r.area_code, r.region_name, r.month, r.all, r.detached, r.semi, r.terraced, r.flat);
  });
  await pool.query(
    `INSERT INTO public.hpi_index
       (area_code, region_name, month, index_all, index_detached, index_semi, index_terraced, index_flat)
     VALUES ${values.join(",")}
     ON CONFLICT (area_code, month) DO UPDATE SET
       region_name = EXCLUDED.region_name,
       index_all = EXCLUDED.index_all,
       index_detached = EXCLUDED.index_detached,
       index_semi = EXCLUDED.index_semi,
       index_terraced = EXCLUDED.index_terraced,
       index_flat = EXCLUDED.index_flat,
       updated_at = NOW()`,
    params,
  );
}

async function main() {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let cols = null;
  let idx = {};
  let batch = [];
  let total = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const f = line.split(",");
    if (!cols) {
      cols = f.map((c) => c.replace(/^"|"$/g, ""));
      idx = {
        date: findCol(cols, "Date"),
        region: findCol(cols, "RegionName"),
        area: findCol(cols, "AreaCode"),
        all: findCol(cols, "Index"),
        detached: findCol(cols, "DetachedIndex"),
        semi: findCol(cols, "SemiDetachedIndex"),
        terraced: findCol(cols, "TerracedIndex"),
        flat: findCol(cols, "FlatIndex"),
      };
      if (idx.date < 0 || idx.area < 0 || idx.all < 0) {
        console.error(`Could not detect required columns. Header: ${cols.slice(0, 6).join(", ")}…`);
        process.exit(1);
      }
      console.log(`Columns -> ${JSON.stringify(idx)}`);
      continue;
    }
    const month = toMonth(f[idx.date]);
    const area = f[idx.area]?.trim();
    const region = f[idx.region]?.replace(/^"|"$/g, "").trim();
    if (!month || !area || !region) {
      skipped++;
      continue;
    }
    batch.push({
      area_code: area,
      region_name: region,
      month,
      all: num(f[idx.all]),
      detached: num(f[idx.detached]),
      semi: num(f[idx.semi]),
      terraced: num(f[idx.terraced]),
      flat: num(f[idx.flat]),
    });
    if (batch.length >= BATCH) {
      await upsert(batch);
      total += batch.length;
      batch = [];
    }
  }
  await upsert(batch);
  total += batch.length;
  console.log(`Done. Upserted ${total.toLocaleString()} HPI rows, skipped ${skipped.toLocaleString()}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
