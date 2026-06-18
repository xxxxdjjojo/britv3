/**
 * scripts/ingest-naptan.mjs
 *
 * Ingests STATION-level transport stops from the NaPTAN access-nodes feed
 * (DfT, Open Government Licence v3.0) into public.transport_stops, so the
 * property-detail Local Area "Transport" widget can show nearby stations.
 *
 * Scope (stations only — on-street bus stops are intentionally excluded):
 *   RLY            -> rail   (National Rail + heritage railways)
 *   MET            -> tube / tram   (classified by CommonName keyword)
 *   FER, FBT       -> ferry  (ferry terminals / berths)
 * Platform-level rows (PLT, RPL) are skipped — MET/RLY are station-level and
 * the get_nearby_transport_stops RPC dedupes any name collisions.
 *
 * Idempotent: upserts on the NaPTAN ATCOCode. Dry-run by default; pass
 * --commit to write. The full feed is ~400k rows but only ~4k survive the
 * station filter.
 *
 * Usage (reads SUPABASE_DB_URL from .env.local or the environment):
 *   node scripts/ingest-naptan.mjs            # dry run — prints histogram + sample
 *   node scripts/ingest-naptan.mjs --commit   # write to transport_stops
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const COMMIT = process.argv.includes("--commit");
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const NAPTAN_CSV_URL =
  "https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv";
const STATION_STOP_TYPES = new Set(["RLY", "MET", "FER", "FBT"]);
const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Env: prefer real env vars, fall back to .env.local (values may carry inline
// "# emoji" annotations, so strip trailing comments and surrounding quotes).
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
      if (i === -1) continue;
      const key = line.slice(0, i).trim();
      if (key !== "SUPABASE_DB_URL") continue;
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

/**
 * TLS trust anchor for the Supabase pooler, which chains to the self-signed
 * "Supabase Root 2021 CA". We pin that public root and keep full verification
 * on (never disable rejectUnauthorized). Operators can override with
 * PGSSLROOTCERT to point at their own bundle.
 */
function loadCaCert() {
  const caPath =
    process.env.PGSSLROOTCERT ||
    resolve(SCRIPT_DIR, "certs", "supabase-prod-ca-2021.crt");
  return readFileSync(caPath, "utf8");
}

// ---------------------------------------------------------------------------
// CSV: a minimal RFC-4180-ish line splitter (handles quoted fields + commas).
// ---------------------------------------------------------------------------

/**
 * Fast path: plain comma split (the NaPTAN feed rarely quotes fields). Falls
 * back to a quote-aware parse only when a quote is present, so we don't pay the
 * char-by-char cost on every one of ~400k rows.
 */
function splitCsvLine(line) {
  if (line.indexOf('"') === -1) return line.split(",");
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
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
// Classify a NaPTAN row into one of our four station categories, or null.
// ---------------------------------------------------------------------------

function classify(stopType, name) {
  if (stopType === "RLY") return "rail";
  if (stopType === "FER" || stopType === "FBT") return "ferry";
  if (stopType === "MET") {
    const n = name.toLowerCase();
    if (n.includes("underground")) return "tube";
    if (n.includes("railway")) return "rail"; // heritage lines named "... Railway"
    // DLR, Metrolink, Tyne & Wear Metro, trams, Glasgow Subway, etc.
    return "tram";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Stream + filter the NaPTAN CSV into canonical station rows.
// ---------------------------------------------------------------------------

async function fetchStations() {
  const res = await fetch(NAPTAN_CSV_URL, {
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok || !res.body) {
    throw new Error(`NaPTAN fetch failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let header = null;
  let col = {};
  let total = 0;

  const stations = [];
  const byCategory = { rail: 0, tube: 0, tram: 0, ferry: 0 };

  const handleLine = (line) => {
    if (!line) return;
    if (header === null) {
      header = splitCsvLine(line);
      const idx = (name) => header.indexOf(name);
      col = {
        atco: idx("ATCOCode"),
        name: idx("CommonName"),
        lng: idx("Longitude"),
        lat: idx("Latitude"),
        type: idx("StopType"),
        status: idx("Status"),
        locality: idx("LocalityName"),
      };
      return;
    }

    total++;
    // Cheap pre-gate: skip the ~95% of rows (on-street bus stops) that can't
    // be a station before paying for a full CSV split. Exact StopType is still
    // matched below, so a name merely containing "MET" etc. is filtered out.
    if (
      line.indexOf("RLY") === -1 &&
      line.indexOf("MET") === -1 &&
      line.indexOf("FER") === -1 &&
      line.indexOf("FBT") === -1
    ) {
      return;
    }
    const f = splitCsvLine(line);
    const stopType = f[col.type];
    if (!STATION_STOP_TYPES.has(stopType)) return;
    if ((f[col.status] || "").toLowerCase() !== "active") return;

    const name = (f[col.name] || "").trim();
    const lng = Number(f[col.lng]);
    const lat = Number(f[col.lat]);
    const atco = (f[col.atco] || "").trim();
    if (!name || !atco || !Number.isFinite(lng) || !Number.isFinite(lat)) return;
    // Sanity bounds for Great Britain.
    if (lat < 49 || lat > 61 || lng < -9 || lng > 2) return;

    const category = classify(stopType, name);
    if (!category) return;

    byCategory[category]++;
    stations.push({
      atco,
      name,
      stop_type: category,
      lng,
      lat,
      locality: (f[col.locality] || "").trim() || null,
    });
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      handleLine(buffer.slice(0, nl).replace(/\r$/, ""));
      buffer = buffer.slice(nl + 1);
    }
  }
  handleLine(buffer.replace(/\r$/, ""));

  // Dedupe on atco_code (the upsert key) — keep first occurrence.
  const seen = new Set();
  const deduped = [];
  for (const s of stations) {
    if (seen.has(s.atco)) continue;
    seen.add(s.atco);
    deduped.push(s);
  }

  return { deduped, total, byCategory, dupes: stations.length - deduped.length };
}

// ---------------------------------------------------------------------------
// Upsert in batches.
// ---------------------------------------------------------------------------

async function upsertBatch(client, batch) {
  const values = [];
  const params = [];
  batch.forEach((s, i) => {
    const b = i * 6;
    values.push(
      `($${b + 1}, $${b + 2}, $${b + 3}, ` +
        `st_setsrid(st_makepoint($${b + 4}, $${b + 5}), 4326)::geography, $${b + 6})`,
    );
    params.push(s.atco, s.name, s.stop_type, s.lng, s.lat, s.locality);
  });
  await client.query(
    `insert into public.transport_stops
       (atco_code, name, stop_type, coordinates, locality)
     values ${values.join(", ")}
     on conflict (atco_code) do update set
       name = excluded.name,
       stop_type = excluded.stop_type,
       coordinates = excluded.coordinates,
       locality = excluded.locality`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbUrl = loadDbUrl();
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not set (env or .env.local).");

  console.log("Fetching NaPTAN access-nodes feed…");
  const { deduped, total, byCategory, dupes } = await fetchStations();

  console.log(`Scanned ${total} NaPTAN rows.`);
  console.log(
    `Station rows after filter: ${deduped.length} ` +
      `(rail ${byCategory.rail}, tube ${byCategory.tube}, ` +
      `tram ${byCategory.tram}, ferry ${byCategory.ferry}; ${dupes} dupes dropped).`,
  );
  console.log("Sample:");
  for (const s of deduped.slice(0, 6)) {
    console.log(`  ${s.stop_type.padEnd(5)} ${s.name}  [${s.atco}]`);
  }

  if (!COMMIT) {
    console.log("\nDry run — no writes. Re-run with --commit to ingest.");
    return;
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    // Verify the pooler cert against the pinned Supabase root CA (no MITM).
    ssl: { ca: loadCaCert(), rejectUnauthorized: true },
  });
  await client.connect();
  try {
    let written = 0;
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      await upsertBatch(client, batch);
      written += batch.length;
      console.log(`  upserted ${written}/${deduped.length}`);
    }
    const { rows } = await client.query(
      "select stop_type, count(*)::int n from public.transport_stops group by stop_type order by n desc",
    );
    console.log("transport_stops now holds:");
    for (const r of rows) console.log(`  ${r.stop_type}: ${r.n}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
