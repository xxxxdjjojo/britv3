/**
 * scripts/ingest-inspire.ts
 *
 * Loads HM Land Registry INSPIRE Index Polygons (per-LAD GML) into
 * public.parcels — the freehold title-parcel "cadastre" geometry the sold
 * properties layer snaps real Land-Registry sales onto.
 *
 * Source: HM Land Registry "INSPIRE Index Polygons spatial data" (per-council
 * GML ZIP from use-land-property-data.service.gov.uk). OGL v3.0.
 * Geometry licence/attribution (Ordnance Survey): AC0000851063.
 *
 * The GML is EPSG:27700 (British National Grid); src/lib/inspire/parse-inspire-gml
 * reprojects every vertex to WGS84 (4326) and yields GeoJSON MultiPolygon
 * coordinates, inserted via ST_Multi(ST_MakeValid(ST_GeomFromGeoJSON(...))).
 *
 * Mirrors the other ingest scripts: pg client + pinned TLS to the Supabase prod
 * CA, SUPABASE_DB_URL via loadDbUrl. Dry run by default (parses + counts, NO
 * writes). --commit writes.
 *   node --experimental-strip-types scripts/ingest-inspire.ts \
 *     --gml ".../Land_Registry_Cadastral_Parcels.gml" --lad-cd E09000030 \
 *     --lad-name "Tower Hamlets" [--commit] [--limit N]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { parseInspireGml } from "../src/lib/inspire/parse-inspire-gml.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");
const BATCH_SIZE = 500;

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const GML_PATH = argValue("--gml");
const LAD_CD = argValue("--lad-cd");
const LAD_NAME = argValue("--lad-name");
const LIMIT = argValue("--limit") ? Number(argValue("--limit")) : null;

function loadDbUrl(): string {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.split("#")[0].trim();
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i === -1 || line.slice(0, i).trim() !== "SUPABASE_DB_URL") continue;
      return line.slice(i + 1).trim().replace(/^["']|["']$/g, "").split("#")[0].trim().replace(/\s+.*$/, "");
    }
  } catch {
    /* ignore */
  }
  return "";
}

function loadCaCert(): string {
  const caPath = process.env.PGSSLROOTCERT || resolve(SCRIPT_DIR, "certs", "supabase-prod-ca-2021.crt");
  return readFileSync(caPath, "utf8");
}

type ParcelRow = { inspireId: string; geomJson: string };

async function upsertBatch(client: pg.Client, batch: ParcelRow[], runId: string): Promise<number> {
  const values: unknown[] = [];
  const tuples = batch.map((r, j) => {
    const b = j * 4;
    values.push(r.inspireId, r.geomJson, LAD_CD, LAD_NAME);
    // ST_MakeValid guards self-intersecting cadastral rings; ST_Multi casts
    // Polygon→MultiPolygon to match the column type.
    return (
      `($${b + 1}, ST_Multi(ST_CollectionExtract(ST_MakeValid(` +
      `ST_SetSRID(ST_GeomFromGeoJSON($${b + 2}), 4326)), 3)), $${b + 3}, $${b + 4}, '${runId}')`
    );
  });
  await client.query(
    `insert into public.parcels (inspire_id, geometry, lad_cd, lad_name, ingest_run_id)
     values ${tuples.join(",")}
     on conflict (inspire_id) do update set
       geometry = excluded.geometry, lad_cd = excluded.lad_cd,
       lad_name = excluded.lad_name, ingest_run_id = excluded.ingest_run_id,
       updated_at = now()`,
    values,
  );
  return batch.length;
}

async function main(): Promise<void> {
  if (!GML_PATH) {
    console.error("--gml <path> is required (the extracted Land_Registry_Cadastral_Parcels.gml).");
    process.exit(1);
  }
  console.log(`INSPIRE ingest — ${GML_PATH}`);
  console.log(`  LAD: ${LAD_NAME ?? "?"} (${LAD_CD ?? "?"}). ${COMMIT ? "Writing." : "Dry run — no writes."}`);

  const gml = readFileSync(resolve(GML_PATH), "utf8");
  const parcels = parseInspireGml(gml);
  console.log(`  Parsed ${parcels.length.toLocaleString("en-GB")} parcels from GML.`);
  if (parcels.length > 0) {
    const p = parcels[0];
    console.log(`  e.g. ${p.inspireId}: ${p.polygons.length} polygon(s), ${p.polygons[0][0].length} exterior pts`);
  }

  const rows: ParcelRow[] = [];
  for (const p of parcels) {
    if (LIMIT !== null && rows.length >= LIMIT) break;
    rows.push({
      inspireId: p.inspireId,
      geomJson: JSON.stringify({ type: "MultiPolygon", coordinates: p.polygons }),
    });
  }

  if (!COMMIT) {
    console.log(`  Dry run — would upsert ${rows.length.toLocaleString("en-GB")} parcels. Pass --commit to write.`);
    return;
  }

  const dbUrl = loadDbUrl();
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL not set (and not in .env.local).");
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: dbUrl, ssl: { ca: loadCaCert(), rejectUnauthorized: true } });
  await client.connect();
  await client.query("SET statement_timeout = 0");

  const run = await client.query(
    `insert into public.parcel_ingest_runs (file_label, lad_cd, lad_name) values ($1,$2,$3) returning id`,
    [GML_PATH.split("/").pop() ?? GML_PATH, LAD_CD, LAD_NAME],
  );
  const runId = run.rows[0].id as string;

  let upserted = 0;
  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      upserted += await upsertBatch(client, rows.slice(i, i + BATCH_SIZE), runId);
      if (upserted % 5000 < BATCH_SIZE) console.log(`  ${upserted.toLocaleString("en-GB")} upserted…`);
    }
    await client.query(
      `update public.parcel_ingest_runs set status='succeeded', rows_upserted=$2, finished_at=now() where id=$1`,
      [runId, upserted],
    );
    console.log(`Done. ${upserted.toLocaleString("en-GB")} parcels upserted.`);
  } catch (err) {
    await client.query(
      `update public.parcel_ingest_runs set status='failed', error=$2, finished_at=now() where id=$1`,
      [runId, err instanceof Error ? err.message : String(err)],
    );
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
