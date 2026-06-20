/**
 * scripts/ingest-epc.ts
 *
 * Bulk-loads the downloaded EPC domestic dataset into public.epc_certificates.
 * The dataset lives on disk as per-year `certificates-YYYY.csv` files (ignore
 * the `recommendations-*` files). A property recurs across years, so we process
 * newest → oldest and the keep-latest upsert (ON CONFLICT property_key) leaves
 * one (latest by inspection_date) certificate per property.
 *
 * Mirrors the other ingest scripts (pg client + pinned TLS to the Supabase prod
 * CA, SUPABASE_DB_URL via loadDbUrl). Streams every file line-by-line — a file
 * is never loaded into memory.
 *
 * Dry run by default (parses + counts, NO DB connection). --commit writes.
 *   node --experimental-strip-types scripts/ingest-epc.ts --year 2026
 *   node --experimental-strip-types scripts/ingest-epc.ts --commit --year 2026
 *   node --experimental-strip-types scripts/ingest-epc.ts --commit          # all years
 * Flags: --dir <path> --year YYYY --limit N (cap rows, for quick test slices).
 */
import { createReadStream, readFileSync, readdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  parseEpcHeader,
  parseEpcRow,
  type EpcCertificate,
} from "../src/lib/epc/parse-epc-row.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");
const DEFAULT_DIR = "/Users/jojominime/Downloads/domestic-csv";
const BATCH_SIZE = 1500;

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const DIR = argValue("--dir") ?? DEFAULT_DIR;
const YEAR = argValue("--year");
const LIMIT = argValue("--limit") ? Number(argValue("--limit")) : null;

// ---------------------------------------------------------------------------
// Env + TLS (shared shape with the other ingest scripts)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// File discovery + hashing
// ---------------------------------------------------------------------------

/** Per-year certificate files, newest year first. */
function certificateFiles(): { year: number; path: string; label: string }[] {
  const re = /^certificates-(\d{4})\.csv$/;
  return readdirSync(DIR)
    .map((name) => {
      const m = name.match(re);
      if (!m) return null;
      const year = Number(m[1]);
      if (YEAR && String(year) !== YEAR) return null;
      return { year, path: join(DIR, name), label: name };
    })
    .filter((f): f is { year: number; path: string; label: string } => f !== null)
    .sort((a, b) => b.year - a.year);
}

function sha256File(path: string): Promise<string> {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolveHash(hash.digest("hex")))
      .on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Property key (dedup arbiter) — self-contained normalisers
// ---------------------------------------------------------------------------

const normPostcode = (pc: string): string => pc.toUpperCase().replace(/\s+/g, "");
const normToken = (t: string): string => t.toUpperCase().replace(/\s+/g, "");

/** uprn when present, else "pc:POSTCODE|PAON"; null when neither is usable. */
function propertyKey(cert: EpcCertificate): string | null {
  if (cert.uprn) return `uprn:${cert.uprn}`;
  if (cert.postcode && cert.paon) {
    return `pc:${normPostcode(cert.postcode)}|${normToken(cert.paon)}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

const COLUMNS = [
  "certificate_number",
  "property_key",
  "uprn",
  "postcode",
  "address1",
  "address2",
  "address3",
  "address_full",
  "paon",
  "current_energy_rating",
  "current_energy_efficiency",
  "potential_energy_rating",
  "potential_energy_efficiency",
  "property_type",
  "built_form",
  "total_floor_area",
  "construction_age_band",
  "tenure",
  "main_fuel",
  "inspection_date",
  "ingest_run_id",
] as const;

type KeyedCert = { key: string; cert: EpcCertificate };

function rowValues(key: string, cert: EpcCertificate, runId: string): unknown[] {
  return [
    cert.certificateNumber,
    key,
    cert.uprn,
    cert.postcode,
    cert.address1,
    cert.address2,
    cert.address3,
    cert.addressFull,
    cert.paon,
    cert.currentEnergyRating,
    cert.currentEnergyEfficiency,
    cert.potentialEnergyRating,
    cert.potentialEnergyEfficiency,
    cert.propertyType,
    cert.builtForm,
    cert.totalFloorArea,
    cert.constructionAgeBand,
    cert.tenure,
    cert.mainFuel,
    cert.inspectionDate,
    runId,
  ];
}

async function upsertBatch(
  client: pg.Client,
  batch: KeyedCert[],
  runId: string,
): Promise<void> {
  const values: unknown[] = [];
  const tuples = batch.map((row, r) => {
    const base = r * COLUMNS.length;
    values.push(...rowValues(row.key, row.cert, runId));
    return `(${COLUMNS.map((_, c) => `$${base + c + 1}`).join(",")})`;
  });

  const updateCols = COLUMNS.filter((c) => c !== "property_key");
  const setClause = updateCols
    .map((c) => `${c} = excluded.${c}`)
    .concat("updated_at = now()")
    .join(", ");

  const sql =
    `insert into public.epc_certificates (${COLUMNS.join(",")})\n` +
    `values ${tuples.join(",")}\n` +
    `on conflict (property_key) do update set ${setClause}\n` +
    `where excluded.inspection_date is not null\n` +
    `  and (epc_certificates.inspection_date is null\n` +
    `       or excluded.inspection_date > epc_certificates.inspection_date)`;

  await client.query(sql, values);
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

type FileStats = { processed: number; skipped: number; upserted: number };

/**
 * Stream one file. In commit mode, flush keep-latest-deduped batches via
 * `onBatch`. Returns counts. `remaining` caps total rows across the whole run.
 */
async function streamFile(
  path: string,
  remaining: number | null,
  onBatch: ((batch: KeyedCert[]) => Promise<void>) | null,
  onSample: (cert: EpcCertificate, key: string) => void,
): Promise<FileStats> {
  const stats: FileStats = { processed: 0, skipped: 0, upserted: 0 };
  let header: Map<string, number> | null = null;
  let batch = new Map<string, EpcCertificate>(); // dedup within a batch by key

  const rl = createInterface({
    input: createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const flush = async () => {
    if (batch.size === 0) return;
    const rows = [...batch.entries()].map(([key, cert]) => ({ key, cert }));
    if (onBatch) await onBatch(rows);
    stats.upserted += rows.length;
    batch = new Map();
  };

  for await (const line of rl) {
    if (header === null) {
      header = parseEpcHeader(line);
      continue;
    }
    if (line.trim() === "") continue;
    const cert = parseEpcRow(line, header);
    if (!cert) {
      stats.skipped++;
      continue;
    }
    const key = propertyKey(cert);
    if (!key) {
      stats.skipped++;
      continue;
    }

    stats.processed++;
    if (stats.processed <= 3) onSample(cert, key);

    // keep-latest within the batch window
    const existing = batch.get(key);
    if (!existing || (cert.inspectionDate ?? "") >= (existing.inspectionDate ?? "")) {
      batch.set(key, cert);
    }
    if (batch.size >= BATCH_SIZE) await flush();

    if (remaining !== null && stats.processed >= remaining) break;
  }
  rl.close();
  await flush();
  return stats;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const files = certificateFiles();
  if (files.length === 0) {
    console.error(`No certificates-YYYY.csv files in ${DIR}${YEAR ? ` for year ${YEAR}` : ""}.`);
    process.exit(1);
  }
  console.log(
    `EPC ingest — ${files.length} file(s) from ${DIR}` +
      `${LIMIT ? `, capped at ${LIMIT} rows` : ""}. ` +
      `${COMMIT ? "Writing." : "Dry run — no DB writes."}`,
  );

  let client: pg.Client | null = null;
  if (COMMIT) {
    const dbUrl = loadDbUrl();
    if (!dbUrl) {
      console.error("SUPABASE_DB_URL not set (and not in .env.local).");
      process.exit(1);
    }
    client = new pg.Client({
      connectionString: dbUrl,
      ssl: { ca: loadCaCert(), rejectUnauthorized: true },
    });
    await client.connect();
  }

  let remaining = LIMIT;
  let totalProcessed = 0;
  let totalUpserted = 0;
  let totalSkipped = 0;

  try {
    for (const file of files) {
      if (remaining !== null && remaining <= 0) break;

      const sample = (cert: EpcCertificate, key: string) =>
        console.log(`  e.g. ${cert.certificateNumber} → ${key} (${cert.currentEnergyRating ?? "?"} → ${cert.potentialEnergyRating ?? "?"})`);

      if (!COMMIT) {
        const stats = await streamFile(file.path, remaining, null, sample);
        console.log(`  ${file.label}: ${stats.processed} parsed, ${stats.skipped} skipped (no key/malformed).`);
        totalProcessed += stats.processed;
        totalSkipped += stats.skipped;
        if (remaining !== null) remaining -= stats.processed;
        continue;
      }

      // commit path
      const sha = await sha256File(file.path);
      const done = await client!.query(
        `select 1 from public.epc_ingest_runs where file_sha256 = $1 and status = 'succeeded' limit 1`,
        [sha],
      );
      if (done.rowCount && done.rowCount > 0) {
        console.log(`  ${file.label}: already ingested (sha match) — skipping.`);
        continue;
      }
      const run = await client!.query(
        `insert into public.epc_ingest_runs (file_label, file_sha256) values ($1, $2) returning id`,
        [file.label, sha],
      );
      const runId = run.rows[0].id as string;

      try {
        const stats = await streamFile(
          file.path,
          remaining,
          (batch) => upsertBatch(client!, batch, runId),
          sample,
        );
        await client!.query(
          `update public.epc_ingest_runs
             set status = 'succeeded', rows_processed = $2, rows_upserted = $3, finished_at = now()
           where id = $1`,
          [runId, stats.processed, stats.upserted],
        );
        console.log(`  ${file.label}: ${stats.processed} parsed, ${stats.upserted} upserted, ${stats.skipped} skipped.`);
        totalProcessed += stats.processed;
        totalUpserted += stats.upserted;
        totalSkipped += stats.skipped;
        if (remaining !== null) remaining -= stats.processed;
      } catch (err) {
        await client!.query(
          `update public.epc_ingest_runs set status = 'failed', error = $2, finished_at = now() where id = $1`,
          [runId, err instanceof Error ? err.message : String(err)],
        );
        throw err;
      }
    }
  } finally {
    if (client) await client.end();
  }

  console.log(
    `Done. ${totalProcessed} parsed, ${COMMIT ? `${totalUpserted} upserted, ` : ""}${totalSkipped} skipped.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
