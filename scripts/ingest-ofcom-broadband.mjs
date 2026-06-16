/**
 * scripts/ingest-ofcom-broadband.mjs
 *
 * Ingests Ofcom Connected Nations 2025 fixed-broadband AVAILABILITY data
 * (Open Government Licence v3.0) into public.broadband_coverage, keyed by
 * postcode, for the property-detail Local Area "Broadband" widget.
 *
 * Ofcom publishes this as a ZIP-in-a-ZIP: an outer coverage bundle containing
 * a nested postcode ZIP, which holds 121 per-area CSVs (one per postcode area)
 * under postcode_files/ (all-premises) and postcode_res_files/ (residential —
 * skipped here). Each CSV gives, per postcode, the % of premises that can get
 * each speed tier. There is NO single Mbit/s figure and no upload data, so we
 * store the tier availabilities verbatim.
 *
 * Columns consumed (matched by exact header name, since column order is not
 * stable year to year):
 *   postcode                              -> primary key (uppercased, no spaces)
 *   SFBB availability (% premises)        -> sfbb_pct      (Superfast >=30)
 *   UFBB availability (% premises)        -> ufbb_pct      (Ultrafast >=300)
 *   Gigabit availability (% premises)     -> gigabit_pct
 *   % of premises below the USO           -> below_uso_pct
 *
 * Requires the `unzip` CLI (present on macOS/Linux). Idempotent: upserts on
 * postcode. Dry-run by default; pass --commit to write. Pass --zip <path> to
 * reuse an already-downloaded outer ZIP instead of re-fetching ~33 MB.
 *
 * Usage (reads SUPABASE_DB_URL from .env.local or the environment):
 *   node scripts/ingest-ofcom-broadband.mjs                 # dry run
 *   node scripts/ingest-ofcom-broadband.mjs --commit
 *   node scripts/ingest-ofcom-broadband.mjs --zip /tmp/ofcom_outer.zip --commit
 */
import { readFileSync, mkdtempSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import pg from "pg";

const COMMIT = process.argv.includes("--commit");
const ZIP_ARG_IDX = process.argv.indexOf("--zip");
const ZIP_PATH = ZIP_ARG_IDX !== -1 ? process.argv[ZIP_ARG_IDX + 1] : null;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const BATCH_SIZE = 2000;

const OFCOM_ZIP_URL =
  "https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/multi-sector/infrastructure-research/connected-nations-2025/202507_fixed_broadband_coverage_r01.zip?v=407830";
// Cloudflare 403s non-browser user agents.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const HEADERS = {
  postcode: "postcode",
  sfbb: "SFBB availability (% premises)",
  ufbb: "UFBB availability (% premises)",
  gigabit: "Gigabit availability (% premises)",
  belowUso: "% of premises below the USO",
};

// ---------------------------------------------------------------------------
// Env + TLS (shared shape with ingest-naptan.mjs)
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
    /* ignore */
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
// Download + extract
// ---------------------------------------------------------------------------

async function downloadOuterZip(destPath) {
  const res = await fetch(OFCOM_ZIP_URL, {
    headers: { "User-Agent": BROWSER_UA },
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`Ofcom download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return destPath;
}

/** Recursively list files under dir whose path includes `/postcode_files/`. */
function listAllPremisesCsvs(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.includes("/postcode_files/") && p.endsWith(".csv")) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/** Download (unless --zip given) and extract the per-area CSV files. */
async function extractCsvFiles(workDir) {
  const outerZip = ZIP_PATH
    ? resolve(ZIP_PATH)
    : await downloadOuterZip(join(workDir, "outer.zip"));

  // 1. Pull the nested postcode ZIP out of the outer bundle (flattened).
  execFileSync("unzip", ["-o", "-j", outerZip, "*fixed_pc_coverage*", "-d", workDir], {
    stdio: "ignore",
  });
  const nestedZip = readdirSync(workDir)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => join(workDir, f))[0];
  if (!nestedZip) throw new Error("Nested postcode ZIP not found in Ofcom bundle.");

  // 2. Extract the per-area CSVs (preserve paths so we can drop residential).
  const csvDir = join(workDir, "csv");
  execFileSync("unzip", ["-o", nestedZip, "*postcode_files/*.csv", "-d", csvDir], {
    stdio: "ignore",
  });
  return listAllPremisesCsvs(csvDir);
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

function parsePct(raw) {
  if (raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Parse one per-area CSV into canonical rows. */
function parseCsv(text) {
  const lines = text.split("\n");
  const header = lines[0].replace(/\r$/, "").split(",");
  const idx = {
    postcode: header.indexOf(HEADERS.postcode),
    sfbb: header.indexOf(HEADERS.sfbb),
    ufbb: header.indexOf(HEADERS.ufbb),
    gigabit: header.indexOf(HEADERS.gigabit),
    belowUso: header.indexOf(HEADERS.belowUso),
  };
  for (const [key, i] of Object.entries(idx)) {
    if (i === -1) throw new Error(`Missing expected column for "${key}" (${HEADERS[key]}).`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = line.replace(/\r$/, "").split(",");
    const postcode = (f[idx.postcode] || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!postcode) continue;
    rows.push({
      postcode,
      sfbb_pct: parsePct(f[idx.sfbb]),
      ufbb_pct: parsePct(f[idx.ufbb]),
      gigabit_pct: parsePct(f[idx.gigabit]),
      below_uso_pct: parsePct(f[idx.belowUso]),
    });
  }
  return rows;
}

/** Headline tier for the dry-run histogram (mirrors the widget's logic). */
function fastestTier(r) {
  if ((r.gigabit_pct ?? 0) >= 50) return "gigabit";
  if ((r.ufbb_pct ?? 0) >= 50) return "ultrafast";
  if ((r.sfbb_pct ?? 0) >= 50) return "superfast";
  return "standard";
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

async function upsertBatch(client, batch) {
  const values = [];
  const params = [];
  batch.forEach((r, i) => {
    const b = i * 5;
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`);
    params.push(r.postcode, r.sfbb_pct, r.ufbb_pct, r.gigabit_pct, r.below_uso_pct);
  });
  await client.query(
    `insert into public.broadband_coverage
       (postcode, sfbb_pct, ufbb_pct, gigabit_pct, below_uso_pct)
     values ${values.join(", ")}
     on conflict (postcode) do update set
       sfbb_pct = excluded.sfbb_pct,
       ufbb_pct = excluded.ufbb_pct,
       gigabit_pct = excluded.gigabit_pct,
       below_uso_pct = excluded.below_uso_pct,
       updated_at = now()`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbUrl = loadDbUrl();
  if (COMMIT && !dbUrl) throw new Error("SUPABASE_DB_URL not set (env or .env.local).");

  const workDir = mkdtempSync(join(tmpdir(), "ofcom-bb-"));
  console.log(
    ZIP_PATH ? `Using local ZIP ${ZIP_PATH}` : "Downloading Ofcom CN2025 coverage bundle (~33 MB)…",
  );
  const csvFiles = await extractCsvFiles(workDir);
  console.log(`Extracted ${csvFiles.length} per-area CSV files.`);

  const client = COMMIT
    ? new pg.Client({ connectionString: dbUrl, ssl: { ca: loadCaCert(), rejectUnauthorized: true } })
    : null;
  if (client) await client.connect();

  const tierTotals = { gigabit: 0, ultrafast: 0, superfast: 0, standard: 0 };
  let totalRows = 0;
  const sample = [];

  try {
    for (const file of csvFiles) {
      const rows = parseCsv(readFileSync(file, "utf8"));
      totalRows += rows.length;
      for (const r of rows) tierTotals[fastestTier(r)]++;
      if (sample.length < 6) sample.push(...rows.slice(0, 6 - sample.length));

      if (client) {
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          await upsertBatch(client, rows.slice(i, i + BATCH_SIZE));
        }
        console.log(`  upserted ${file.split("/").pop()} (${rows.length} rows, ${totalRows} total)`);
      }
    }

    console.log(`\nParsed ${totalRows} postcodes.`);
    console.log(
      `Fastest tier mix: gigabit ${tierTotals.gigabit}, ultrafast ${tierTotals.ultrafast}, ` +
        `superfast ${tierTotals.superfast}, standard ${tierTotals.standard}.`,
    );
    console.log("Sample:");
    for (const r of sample) {
      console.log(
        `  ${r.postcode.padEnd(8)} SFBB ${r.sfbb_pct}%  UFBB ${r.ufbb_pct}%  ` +
          `Gigabit ${r.gigabit_pct}%  belowUSO ${r.below_uso_pct}%`,
      );
    }

    if (client) {
      const { rows } = await client.query("select count(*)::int n from public.broadband_coverage");
      console.log(`broadband_coverage now holds ${rows[0].n} postcodes.`);
    } else {
      console.log("\nDry run — no writes. Re-run with --commit to ingest.");
    }
  } finally {
    if (client) await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
