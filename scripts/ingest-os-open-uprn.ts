/**
 * scripts/ingest-os-open-uprn.ts
 *
 * Bulk-loads OS Open UPRN coordinates into public.os_open_uprn, but ONLY for
 * the UPRNs we already hold an EPC for — so the sold-properties map layer can
 * point at a real lat/long per certificate without storing the full ~40M-row
 * national table.
 *
 * Source:
 *   Ordnance Survey — OS Open UPRN
 *   © Crown copyright and database rights 2026 Ordnance Survey AC0000851063.
 *   Licence: Open Government Licence v3.0 (OGL).
 *   Format: a single national CSV with header
 *           `UPRN,X_COORDINATE,Y_COORDINATE,LATITUDE,LONGITUDE`
 *           (~40M rows). Extract the ZIP before running this script.
 *
 * Mirrors the other ingest scripts (pg client + pinned TLS to the Supabase prod
 * CA, SUPABASE_DB_URL via loadDbUrl). Streams the CSV line-by-line — the file is
 * never loaded into memory. The EPC uprn set (~770k entries) is loaded once into
 * memory so we only upsert rows we care about. We never insert `geom` — it is a
 * generated column.
 *
 * Dry run by default (streams + counts how many rows WOULD match the EPC set,
 * loading the set so the count is real; NO writes). --commit writes.
 *   node --experimental-strip-types scripts/ingest-os-open-uprn.ts --csv /path/to/osopenuprn.csv
 *   node --experimental-strip-types scripts/ingest-os-open-uprn.ts --commit --csv /path/to/osopenuprn.csv
 * Flags: --csv <path> (required) --limit N (cap CSV lines, for quick test slices).
 */
import { createReadStream, readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");
const BATCH_SIZE = 2000;
const LOG_EVERY = 1_000_000;

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const CSV = argValue("--csv");
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
// EPC UPRN set
// ---------------------------------------------------------------------------

/** Load every numeric uprn we hold an EPC for into an in-memory set. */
async function loadEpcUprnSet(client: pg.Client): Promise<Set<string>> {
  const set = new Set<string>();
  const { rows } = await client.query(
    `select uprn from public.epc_certificates where uprn ~ '^[0-9]+$'`,
  );
  for (const row of rows) set.add(String(row.uprn));
  return set;
}

// ---------------------------------------------------------------------------
// Header mapping (resolve columns by name, case-insensitive)
// ---------------------------------------------------------------------------

type ColMap = { uprn: number; latitude: number; longitude: number };

function buildColMap(headerLine: string): ColMap {
  const cols = headerLine.split(",").map((s) => s.trim().toLowerCase());
  const idx = (name: string): number => cols.indexOf(name);
  return {
    uprn: idx("uprn"),
    latitude: idx("latitude"),
    longitude: idx("longitude"),
  };
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

type UprnRow = { uprn: string; latitude: number; longitude: number };

async function upsertBatch(client: pg.Client, rows: UprnRow[]): Promise<void> {
  if (rows.length === 0) return;
  const params: unknown[] = [];
  const tuples = rows.map((r, i) => {
    const b = i * 3;
    params.push(r.uprn, r.latitude, r.longitude);
    return `($${b + 1}, $${b + 2}, $${b + 3})`;
  });

  await client.query(
    `insert into public.os_open_uprn (uprn, latitude, longitude)\n` +
      `values ${tuples.join(",")}\n` +
      `on conflict (uprn) do update set\n` +
      `  latitude = excluded.latitude,\n` +
      `  longitude = excluded.longitude`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!CSV) {
    console.error("Missing required --csv <path> (the extracted OS Open UPRN CSV).");
    process.exit(1);
  }
  const csvPath = resolve(CSV);
  if (!existsSync(csvPath)) {
    console.error(`CSV not found at: ${csvPath}`);
    process.exit(1);
  }

  console.log(
    `OS Open UPRN ingest — ${csvPath}` +
      `${LIMIT ? `, capped at ${LIMIT} CSV lines` : ""}. ` +
      `${COMMIT ? "Writing." : "Dry run — no DB writes (still counts real matches)."}`,
  );

  const dbUrl = loadDbUrl();
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL not set (and not in .env.local).");
    process.exit(1);
  }

  // We connect in both modes: dry run needs the EPC set for a real match count.
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { ca: loadCaCert(), rejectUnauthorized: true },
  });
  await client.connect();

  let linesRead = 0;
  let matched = 0;
  let upserted = 0;

  try {
    const epcUprns = await loadEpcUprnSet(client);
    console.log(`Loaded ${epcUprns.size.toLocaleString("en-GB")} EPC UPRNs.`);

    let colMap: ColMap | null = null;
    let batch: UprnRow[] = [];

    const rl = createInterface({
      input: createReadStream(csvPath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    const flush = async () => {
      if (batch.length === 0) return;
      if (COMMIT) {
        await upsertBatch(client, batch);
        upserted += batch.length;
      }
      batch = [];
    };

    for await (const line of rl) {
      if (colMap === null) {
        colMap = buildColMap(line);
        if (colMap.uprn === -1 || colMap.latitude === -1 || colMap.longitude === -1) {
          console.error(`Could not find UPRN/LATITUDE/LONGITUDE columns in header: ${line}`);
          process.exit(1);
        }
        continue;
      }
      if (line.trim() === "") continue;

      linesRead++;
      if (linesRead % LOG_EVERY === 0) {
        console.log(
          `  ${linesRead.toLocaleString("en-GB")} lines read, ` +
            `${matched.toLocaleString("en-GB")} matched.`,
        );
      }

      const fields = line.split(",");
      const uprn = (fields[colMap.uprn] ?? "").trim();
      if (!uprn || !epcUprns.has(uprn)) {
        if (LIMIT !== null && linesRead >= LIMIT) break;
        continue;
      }

      const latitude = Number(fields[colMap.latitude]);
      const longitude = Number(fields[colMap.longitude]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        if (LIMIT !== null && linesRead >= LIMIT) break;
        continue;
      }

      matched++;
      if (COMMIT) {
        batch.push({ uprn, latitude, longitude });
        if (batch.length >= BATCH_SIZE) await flush();
      }

      if (LIMIT !== null && linesRead >= LIMIT) break;
    }
    rl.close();
    await flush();
  } finally {
    await client.end();
  }

  const verb = COMMIT ? "upserted" : "would upsert";
  console.log(
    `Done. ${linesRead.toLocaleString("en-GB")} CSV lines read, ` +
      `${matched.toLocaleString("en-GB")} matched the EPC set, ` +
      `${(COMMIT ? upserted : matched).toLocaleString("en-GB")} ${verb}.`,
  );
  if (!COMMIT) console.log("Dry run — no writes. Pass --commit to ingest.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
