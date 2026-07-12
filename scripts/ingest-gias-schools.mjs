/**
 * scripts/ingest-gias-schools.mjs
 *
 * Ingests school establishments from the DfE "Get Information About Schools"
 * (GIAS) bulk export, joined to Ofsted "latest inspections" management
 * information for the legacy overall-effectiveness grade (both Open Government
 * Licence v3.0), into public.schools — so the property-detail Local Area
 * "Schools" widget can show nearby schools with their Ofsted rating.
 *
 * Scope: Open establishments that have a real PhaseOfEducation (Primary,
 * Secondary, All-through, Nursery, 16 plus, Middle deemed primary/secondary,
 * etc.). Rows with no phase ("", "Not applicable" — e.g. children's centres)
 * are excluded. GIAS gives OSGB36 Easting/Northing (EPSG:27700); the WGS84
 * geography is derived in Postgres at upsert time via st_transform.
 *
 * Idempotent: upserts on the GIAS URN. Dry-run by default; pass --commit to
 * write.
 *
 * Usage (reads SUPABASE_DB_URL from .env.local or the environment):
 *   node scripts/ingest-gias-schools.mjs                  # dry run — histograms + sample
 *   node scripts/ingest-gias-schools.mjs --commit         # write to schools
 *   node scripts/ingest-gias-schools.mjs --gias-file P    # use a local GIAS CSV
 *   node scripts/ingest-gias-schools.mjs --ofsted-file P  # use a local Ofsted CSV
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const COMMIT = process.argv.includes("--commit");
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const BATCH_SIZE = 500;

// Sanity floor: the state-funded MI file reliably yields ~9,775 ratings. If a
// --commit run loads implausibly few, the Ofsted source has degraded and the
// upsert (ofsted_rating = excluded.ofsted_rating) would null out existing data.
const MIN_EXPECTED_OFSTED_RATINGS = 1000;

// GIAS bulk export URL is dated by day: edubasealldata<YYYYMMDD>.csv.
const GIAS_URL_BASE =
  "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public";
const OFSTED_INDEX_URL =
  "https://www.gov.uk/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes";

// PhaseOfEducation values that are NOT real schools — dropped.
const NON_SCHOOL_PHASES = new Set(["", "not applicable"]);

// Latest OEIF overall effectiveness code -> our rating enum.
const OFSTED_RATING_BY_CODE = {
  1: "Outstanding",
  2: "Good",
  3: "Requires improvement",
  4: "Inadequate",
};

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

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
 * Fast path: plain comma split. Falls back to a quote-aware parse only when a
 * quote is present, so we don't pay the char-by-char cost on every row.
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
// Load a Windows-1252 CSV (GIAS + Ofsted are both cp1252, not utf-8) either
// from a local file or over HTTP.
// ---------------------------------------------------------------------------

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

async function loadCsvText(localPath, url) {
  if (localPath) {
    // readFileSync as a buffer, decode as windows-1252.
    const buf = readFileSync(localPath);
    return new TextDecoder("windows-1252").decode(buf);
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status} (${url})`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return new TextDecoder("windows-1252").decode(buf);
}

function splitLines(text) {
  return text.split("\n").map((l) => l.replace(/\r$/, ""));
}

// ---------------------------------------------------------------------------
// Ofsted: URN -> rating map from the "latest inspections" MI CSV.
// ---------------------------------------------------------------------------

/**
 * Discover the newest "state-funded schools latest inspections" CSV asset link
 * from the gov.uk statistical-data-set page, picking the file whose in-name
 * date is most recent.
 */
async function findOfstedLatestUrl() {
  const res = await fetch(OFSTED_INDEX_URL, {
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Ofsted index fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  const re =
    /https?:\/\/[^"']*Management_information_-_state-funded_schools_-_latest_inspections_as_at_[^"']+\.csv/g;
  const links = [...new Set(html.match(re) || [])];
  if (links.length === 0) {
    throw new Error("No Ofsted latest-inspections CSV link found on gov.uk.");
  }
  const dateOf = (url) => {
    const m = url.match(/as_at_(\d{1,2})_?([A-Za-z]+)_?(\d{4})/);
    return m ? Date.parse(`${m[1]} ${m[2]} ${m[3]}`) || 0 : 0;
  };
  links.sort((a, b) => dateOf(b) - dateOf(a));
  return links[0];
}

async function loadOfstedRatings(localPath) {
  const url = localPath ? null : await findOfstedLatestUrl();
  const text = await loadCsvText(localPath, url);
  const lines = splitLines(text);
  const header = splitCsvLine(lines[0]);
  const urnIdx = header.indexOf("URN");
  const oeifIdx = header.indexOf("Latest OEIF overall effectiveness");
  if (urnIdx === -1 || oeifIdx === -1) {
    throw new Error("Ofsted CSV missing URN / overall-effectiveness columns.");
  }

  const ratings = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = splitCsvLine(line);
    const urn = (f[urnIdx] || "").trim();
    if (!urn) continue;
    const code = Number((f[oeifIdx] || "").trim());
    const rating = OFSTED_RATING_BY_CODE[code] || null;
    if (rating) ratings.set(urn, rating);
  }
  return { ratings, source: url || localPath };
}

// ---------------------------------------------------------------------------
// GIAS: parse + filter Open, real-phase establishments into canonical rows.
// ---------------------------------------------------------------------------

async function loadSchools(localPath, ratings) {
  const url = localPath
    ? null
    : `${GIAS_URL_BASE}/edubasealldata${todayStamp()}.csv`;
  const text = await loadCsvText(localPath, url);
  const lines = splitLines(text);
  const header = splitCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);
  const col = {
    urn: idx("URN"),
    name: idx("EstablishmentName"),
    type: idx("TypeOfEstablishment (name)"),
    phase: idx("PhaseOfEducation (name)"),
    status: idx("EstablishmentStatus (name)"),
    street: idx("Street"),
    locality: idx("Locality"),
    town: idx("Town"),
    postcode: idx("Postcode"),
    la: idx("LA (name)"),
    easting: idx("Easting"),
    northing: idx("Northing"),
  };
  for (const [k, v] of Object.entries(col)) {
    if (v === -1) throw new Error(`GIAS CSV missing column for "${k}".`);
  }

  const schools = [];
  const phaseHist = {};
  let total = 0;
  let rated = 0;
  const ratingHist = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    total++;
    const f = splitCsvLine(line);

    const status = (f[col.status] || "").trim().toLowerCase();
    if (status !== "open") continue;

    const phase = (f[col.phase] || "").trim();
    if (NON_SCHOOL_PHASES.has(phase.toLowerCase())) continue;

    const easting = Number((f[col.easting] || "").trim());
    const northing = Number((f[col.northing] || "").trim());
    if (
      !Number.isFinite(easting) ||
      !Number.isFinite(northing) ||
      easting === 0 ||
      northing === 0
    ) {
      continue;
    }

    const urn = (f[col.urn] || "").trim();
    const name = (f[col.name] || "").trim();
    if (!urn || !name) continue;

    const rating = ratings.get(urn) || null;
    if (rating) {
      rated++;
      ratingHist[rating] = (ratingHist[rating] || 0) + 1;
    }
    phaseHist[phase] = (phaseHist[phase] || 0) + 1;

    schools.push({
      urn,
      name,
      phase: phase || null,
      establishment_type: (f[col.type] || "").trim() || null,
      ofsted_rating: rating,
      easting,
      northing,
      street: (f[col.street] || "").trim() || null,
      locality: (f[col.locality] || "").trim() || null,
      town: (f[col.town] || "").trim() || null,
      postcode: (f[col.postcode] || "").trim() || null,
      la_name: (f[col.la] || "").trim() || null,
    });
  }

  // Dedupe on urn (the upsert key) — keep first occurrence.
  const seen = new Set();
  const deduped = [];
  for (const s of schools) {
    if (seen.has(s.urn)) continue;
    seen.add(s.urn);
    deduped.push(s);
  }

  return {
    deduped,
    total,
    phaseHist,
    rated,
    ratingHist,
    dupes: schools.length - deduped.length,
    source: url || localPath,
  };
}

// ---------------------------------------------------------------------------
// Upsert in batches. OSGB36 Easting/Northing -> WGS84 geography is done in SQL
// via st_transform (PostGIS ships EPSG:27700), so no JS coordinate transform.
// ---------------------------------------------------------------------------

async function upsertBatch(client, batch) {
  const values = [];
  const params = [];
  batch.forEach((s, i) => {
    const b = i * 12;
    values.push(
      `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, ` +
        `st_transform(st_setsrid(st_makepoint($${b + 5}, $${b + 6}), 27700), 4326)::geography, ` +
        `$${b + 7}, $${b + 8}, $${b + 9}, $${b + 10}, $${b + 11}, $${b + 12})`,
    );
    params.push(
      s.urn,
      s.name,
      s.phase,
      s.establishment_type,
      s.easting,
      s.northing,
      s.ofsted_rating,
      s.street,
      s.locality,
      s.town,
      s.postcode,
      s.la_name,
    );
  });
  await client.query(
    `insert into public.schools
       (urn, name, phase, establishment_type, coordinates,
        ofsted_rating, street, locality, town, postcode, la_name)
     values ${values.join(", ")}
     on conflict (urn) do update set
       name = excluded.name,
       phase = excluded.phase,
       establishment_type = excluded.establishment_type,
       coordinates = excluded.coordinates,
       ofsted_rating = excluded.ofsted_rating,
       street = excluded.street,
       locality = excluded.locality,
       town = excluded.town,
       postcode = excluded.postcode,
       la_name = excluded.la_name`,
    params,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function topEntries(hist, n) {
  return Object.entries(hist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

async function main() {
  const dbUrl = loadDbUrl();
  if (COMMIT && !dbUrl) {
    throw new Error("SUPABASE_DB_URL not set (env or .env.local).");
  }

  const giasFile = argValue("--gias-file");
  const ofstedFile = argValue("--ofsted-file");

  console.log("Loading Ofsted latest-inspections management information…");
  const { ratings, source: ofstedSource } =
    await loadOfstedRatings(ofstedFile);
  console.log(`  Ofsted ratings loaded: ${ratings.size} URNs (${ofstedSource})`);

  console.log("Loading GIAS establishments…");
  const { deduped, total, phaseHist, rated, ratingHist, dupes, source } =
    await loadSchools(giasFile, ratings);

  console.log(`\nScanned ${total} GIAS rows (${source}).`);
  console.log(
    `Kept after filter (Open + real phase + valid coords): ${deduped.length}` +
      ` (${dupes} dupes dropped).`,
  );

  console.log("\nPhase histogram (top 15):");
  for (const [phase, n] of topEntries(phaseHist, 15)) {
    console.log(`  ${String(n).padStart(6)}  ${phase}`);
  }

  const pct = deduped.length ? ((rated / deduped.length) * 100).toFixed(1) : "0";
  console.log(`\nWith an Ofsted rating: ${rated}/${deduped.length} (${pct}%)`);
  for (const [rating, n] of topEntries(ratingHist, 4)) {
    console.log(`  ${String(n).padStart(6)}  ${rating}`);
  }

  console.log("\nSample:");
  for (const s of deduped.slice(0, 6)) {
    console.log(
      `  [${s.urn}] ${s.name} — ${s.phase || "?"} / ` +
        `${s.establishment_type || "?"} / ${s.ofsted_rating || "no rating"} / ` +
        `${s.postcode || "?"}  (E${s.easting} N${s.northing})`,
    );
  }

  if (!COMMIT) {
    console.log("\nDry run — no writes. Re-run with --commit to ingest.");
    return;
  }

  // Abort before any write if Ofsted coverage is implausibly low — a degraded
  // source would otherwise null out every existing rating via the upsert.
  if (ratings.size < MIN_EXPECTED_OFSTED_RATINGS) {
    throw new Error(
      `Refusing to commit: only ${ratings.size} Ofsted ratings loaded ` +
        `(expected >= ${MIN_EXPECTED_OFSTED_RATINGS}). The Ofsted source may ` +
        `have degraded — check ${ofstedSource} or pass --ofsted-file with a ` +
        `known-good MI CSV.`,
    );
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    // Verify the pooler cert against the pinned Supabase root CA (no MITM).
    ssl: { ca: loadCaCert(), rejectUnauthorized: true },
  });
  await client.connect();
  try {
    // One transaction across all batches: a mid-run failure rolls back cleanly
    // rather than leaving the live table half-written.
    await client.query("begin");
    try {
      let written = 0;
      for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
        const batch = deduped.slice(i, i + BATCH_SIZE);
        await upsertBatch(client, batch);
        written += batch.length;
        console.log(`  upserted ${written}/${deduped.length}`);
      }
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
    const { rows } = await client.query(
      "select phase, count(*)::int n from public.schools group by phase order by n desc",
    );
    console.log("schools now holds (by phase):");
    for (const r of rows) console.log(`  ${r.phase}: ${r.n}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
