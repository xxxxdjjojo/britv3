/**
 * scripts/ingest-ons-boundaries.mjs
 *
 * Populates public.geography_boundaries from ONS Open Geography Portal
 * boundary GeoJSON files, and optionally derives approximate postcode-district
 * and postcode-sector polygons from postcode_geography centroids.
 *
 * Source:
 *   ONS Open Geography Portal — https://geoportal.statistics.gov.uk/
 *   Licence: Open Government Licence v3.0 (OGL)
 *   Preferred format: Generalised (BGC) GeoJSON — smaller files, appropriate
 *   for thematic mapping. Full (BFC) is also accepted.
 *
 * Supported boundary levels:
 *   local_authority  — Local Authority Districts (LAD)
 *                      Suggested product: "Local Authority Districts (December 2024)
 *                        Boundaries UK BGC"
 *                      Typical property key: LAD24CD / LAD24NM
 *   msoa             — Middle Super Output Areas
 *                      Suggested product: "MSOA (December 2021) Boundaries EW BGC"
 *                      Typical property key: MSOA21CD / MSOA21NM
 *   lsoa             — Lower Super Output Areas
 *                      Suggested product: "LSOA (December 2021) Boundaries EW BGC"
 *                      Typical property key: LSOA21CD / LSOA21NM
 *
 * Usage:
 *   node scripts/ingest-ons-boundaries.mjs \
 *     --lad=/path/to/LAD_BGC.geojson   \
 *     --msoa=/path/to/MSOA_BGC.geojson \
 *     --lsoa=/path/to/LSOA_BGC.geojson \
 *     [--derive-postcode-areas]         # derive district+sector from centroids
 *     [--commit]                        # write to DB (default: dry run)
 *
 * Env/path alternatives (in addition to --flag= args):
 *   LAD_GEOJSON, MSOA_GEOJSON, LSOA_GEOJSON  (env vars, same as flags)
 *
 * Reads SUPABASE_DB_URL from environment or .env.local (same loader used by
 * all other ingest scripts in this repo).
 *
 * Backfill step:
 *   After inserting LAD boundaries (which carry human-readable names), this
 *   script also backfills postcode_geography.lad_name using the code→name
 *   mapping from the LAD GeoJSON. This covers the gap left by ingest-onspd.mjs
 *   which only stores lad_cd.
 *
 * Derived postcode-area polygons (--derive-postcode-areas):
 *   IMPORTANT — APPROXIMATE BOUNDARIES ONLY:
 *   ONS does not publish official postcode-district or postcode-sector polygon
 *   boundaries. When --derive-postcode-areas is passed, this script computes
 *   APPROXIMATE envelopes by grouping postcode centroids already in
 *   postcode_geography and computing ST_Multi(ST_ConvexHull(ST_Collect(point)))
 *   per district/sector. These are convex-hull envelopes of member postcode
 *   centroids — they overestimate the true area and are NOT official boundaries.
 *   Use them for choropleth visualisation only, never for precise spatial
 *   containment tests.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const COMMIT = process.argv.includes("--commit");
const DERIVE_POSTCODE_AREAS = process.argv.includes("--derive-postcode-areas");
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function argVal(flag) {
  const a = process.argv.find((x) => x.startsWith(`--${flag}=`));
  return a ? a.slice(flag.length + 3) : null;
}

const LAD_PATH  = argVal("lad")  || process.env.LAD_GEOJSON  || null;
const MSOA_PATH = argVal("msoa") || process.env.MSOA_GEOJSON || null;
const LSOA_PATH = argVal("lsoa") || process.env.LSOA_GEOJSON || null;

// Batch size for feature inserts (GeoJSON features, not postcode rows)
const BATCH_SIZE = 200;
const LOG_EVERY = 1000;

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
// GeoJSON property extraction (case-insensitive key matching)
// ---------------------------------------------------------------------------

/**
 * Finds the value of the first property whose key matches one of the candidate
 * names (case-insensitive), or returns null. Used because ONS changes property
 * name suffixes between releases (e.g. LAD22CD vs LAD24CD).
 */
function findProp(properties, candidates) {
  const keys = Object.keys(properties);
  for (const candidate of candidates) {
    const lc = candidate.toLowerCase();
    const found = keys.find((k) => k.toLowerCase() === lc);
    if (found !== undefined) {
      const val = properties[found];
      return val != null ? String(val).trim() : null;
    }
  }
  return null;
}

/**
 * Extracts (areaId, areaName) from a GeoJSON feature's properties for a given
 * level. Tries multiple property name variants to handle release differences.
 */
function extractAreaInfo(properties, level) {
  switch (level) {
    case "local_authority":
      return {
        areaId: findProp(properties, [
          "LAD24CD", "LAD23CD", "LAD22CD", "LAD21CD", "LAD20CD", "LADCD",
        ]),
        areaName: findProp(properties, [
          "LAD24NM", "LAD23NM", "LAD22NM", "LAD21NM", "LAD20NM", "LADNM",
        ]),
      };
    case "msoa":
      return {
        areaId: findProp(properties, [
          "MSOA21CD", "MSOA11CD", "MSOAGSSCOD", "MSOACD",
        ]),
        areaName: findProp(properties, [
          "MSOA21NM", "MSOA21NMW", "MSOA11NM", "MSOAGSSNM", "MSOANM",
        ]),
      };
    case "lsoa":
      return {
        areaId: findProp(properties, [
          "LSOA21CD", "LSOA11CD", "LSOAGSSCOD", "LSOACD",
        ]),
        areaName: findProp(properties, [
          "LSOA21NM", "LSOA21NMW", "LSOA11NM", "LSOAGSSNM", "LSOANM",
        ]),
      };
    default:
      return { areaId: null, areaName: null };
  }
}

// ---------------------------------------------------------------------------
// Boundary ingest for a single GeoJSON file
// ---------------------------------------------------------------------------

/**
 * Reads a GeoJSON FeatureCollection from disk (synchronous — ONS BGC files are
 * typically 5-50 MB; no need to stream). Upserts features into
 * geography_boundaries in batches.
 *
 * Returns an array of { code, name } objects for LAD, so callers can build
 * a code→name map for the postcode_geography backfill.
 */
async function ingestGeoJSON(client, filePath, level, dryRun) {
  console.log(`[boundaries] Loading ${level} from: ${filePath}`);
  const raw = readFileSync(filePath, "utf8");
  let geojson;
  try {
    geojson = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[boundaries] Failed to parse GeoJSON: ${err.message}`);
  }

  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error(`[boundaries] Expected a FeatureCollection in ${filePath}`);
  }

  const features = geojson.features;
  console.log(`[boundaries] ${level}: ${features.length} features`);

  let upserted = 0;
  let skipped = 0;
  const ladCodeToName = []; // only populated for local_authority level

  // Process in batches
  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    const batch = features.slice(i, i + BATCH_SIZE);
    const validRows = [];

    for (const feature of batch) {
      if (!feature || feature.type !== "Feature") {
        skipped++;
        continue;
      }
      const props = feature.properties || {};
      const { areaId, areaName } = extractAreaInfo(props, level);

      if (!areaId) {
        if (skipped < 10) {
          console.warn(
            `[boundaries] WARN: Could not extract area_id for ${level} feature. ` +
            `Properties: ${JSON.stringify(props).slice(0, 200)}`,
          );
        }
        skipped++;
        continue;
      }

      const name = areaName || areaId; // fallback to code if name missing

      // Geometry: must be Polygon or MultiPolygon
      const geom = feature.geometry;
      if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) {
        if (skipped < 10) {
          console.warn(
            `[boundaries] WARN: ${level}/${areaId} has unsupported geometry type ` +
            `"${geom?.type}" — skipped`,
          );
        }
        skipped++;
        continue;
      }

      validRows.push({ areaId, name, geomJson: JSON.stringify(geom) });

      if (level === "local_authority") {
        ladCodeToName.push({ code: areaId, name });
      }
    }

    if (validRows.length === 0) continue;

    if (!dryRun) {
      // Build a multi-row upsert. Each row uses ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($n), 4326))
      // to cast Polygon→MultiPolygon and set the SRID, matching geography_boundaries.geometry type.
      // 4 params per row: level, area_id, area_name, geomJson
      const paramsFinal = [];
      const valuesFixed = validRows.map((r, j) => {
        const b = j * 4;
        paramsFinal.push(level, r.areaId, r.name, r.geomJson);
        return (
          `($${b + 1}, $${b + 2}, $${b + 3}, ` +
          `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($${b + 4}), 4326)))`
        );
      });

      try {
        await client.query(
          `insert into public.geography_boundaries (level, area_id, area_name, geometry)
           values ${valuesFixed.join(", ")}
           on conflict (level, area_id) do update set
             area_name = excluded.area_name,
             geometry  = excluded.geometry`,
          paramsFinal,
        );
        upserted += validRows.length;
      } catch (err) {
        console.warn(
          `[boundaries] WARN: batch insert failed for ${level} ` +
          `(rows ${i}–${i + batch.length}): ${err.message}`,
        );
        // fall back to row-by-row for this batch to isolate bad geometries
        for (const r of validRows) {
          try {
            await client.query(
              `insert into public.geography_boundaries (level, area_id, area_name, geometry)
               values ($1, $2, $3, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)))
               on conflict (level, area_id) do update set
                 area_name = excluded.area_name,
                 geometry  = excluded.geometry`,
              [level, r.areaId, r.name, r.geomJson],
            );
            upserted++;
          } catch (rowErr) {
            console.warn(
              `[boundaries] WARN: ${level}/${r.areaId} skipped — ${rowErr.message}`,
            );
            skipped++;
          }
        }
      }
    } else {
      upserted += validRows.length;
    }

    if (i + BATCH_SIZE >= LOG_EVERY && ((i + BATCH_SIZE) % LOG_EVERY) < BATCH_SIZE) {
      console.log(`[boundaries] ${level}: ${upserted} upserted so far…`);
    }
  }

  console.log(
    `[boundaries] ${level} done — ` +
    `${upserted} ${dryRun ? "would upsert" : "upserted"}, ${skipped} skipped`,
  );

  return ladCodeToName;
}

// ---------------------------------------------------------------------------
// Backfill lad_name in postcode_geography from LAD code→name map
// ---------------------------------------------------------------------------

async function backfillLadNames(client, ladCodeToName, dryRun) {
  if (ladCodeToName.length === 0) {
    console.log("[boundaries] No LAD names to backfill (LAD file not provided).");
    return;
  }

  console.log(
    `[boundaries] Backfilling postcode_geography.lad_name for ` +
    `${ladCodeToName.length} LAD codes…`,
  );

  if (dryRun) {
    console.log("[boundaries] Dry run — skipping lad_name backfill.");
    return;
  }

  // Build a temporary VALUES clause for the mapping and do a single UPDATE
  // rather than one UPDATE per LAD (which would be ~350+ round trips).
  const params = [];
  const valueClauses = ladCodeToName.map((entry, i) => {
    params.push(entry.code, entry.name);
    return `($${i * 2 + 1}, $${i * 2 + 2})`;
  });

  await client.query(
    `update public.postcode_geography pg
     set lad_name = mapping.name
     from (values ${valueClauses.join(", ")}) as mapping(code, name)
     where pg.lad_cd = mapping.code
       and pg.lad_name is distinct from mapping.name`,
    params,
  );

  const { rows } = await client.query(
    "select count(*)::bigint as n from public.postcode_geography where lad_name is not null",
  );
  console.log(
    `[boundaries] lad_name backfill done — ` +
    `${Number(rows[0].n).toLocaleString("en-GB")} postcode_geography rows now have lad_name`,
  );
}

// ---------------------------------------------------------------------------
// Derive approximate postcode-district and postcode-sector polygons
// ---------------------------------------------------------------------------

/**
 * Derives APPROXIMATE postcode-district and postcode-sector boundary polygons
 * from postcode centroids already stored in postcode_geography, using convex
 * hulls. These are NOT official ONS boundaries — they overestimate true area
 * and should be used for choropleth visualisation only.
 *
 * Gated behind --derive-postcode-areas flag.
 */
async function derivePostcodeAreaBoundaries(client, dryRun) {
  console.log(
    "[boundaries] Deriving approximate postcode-district boundaries from centroids…\n" +
    "[boundaries] NOTE: These are convex-hull envelopes of postcode centroids —\n" +
    "[boundaries]       NOT official ONS boundaries. Use for visualisation only.",
  );

  if (dryRun) {
    // Even in dry-run, count how many districts/sectors exist to give operator info
    const { rows: countRows } = await client.query(`
      select
        count(distinct postcode_district) filter (where postcode_district is not null) as districts,
        count(distinct postcode_sector)   filter (where postcode_sector   is not null) as sectors
      from public.postcode_geography
      where latitude is not null and longitude is not null
    `);
    const r = countRows[0];
    console.log(
      `[boundaries] Dry run — would derive: ` +
      `${r.districts} districts, ${r.sectors} sectors`,
    );
    return;
  }

  // Districts
  console.log("[boundaries] Computing postcode_district hulls…");
  const districtResult = await client.query(`
    insert into public.geography_boundaries (level, area_id, area_name, geometry)
    select
      'postcode_district'               as level,
      postcode_district                 as area_id,
      postcode_district                 as area_name,
      ST_Multi(
        ST_ConvexHull(
          ST_Collect(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geometry
          )
        )
      )::geometry(multipolygon, 4326)   as geometry
    from public.postcode_geography
    where postcode_district is not null
      and latitude  is not null
      and longitude is not null
    group by postcode_district
    on conflict (level, area_id) do update set
      geometry = excluded.geometry,
      area_name = excluded.area_name
  `);
  console.log(
    `[boundaries] postcode_district: ${districtResult.rowCount} rows upserted (approx convex hulls)`,
  );

  // Sectors
  console.log("[boundaries] Computing postcode_sector hulls…");
  const sectorResult = await client.query(`
    insert into public.geography_boundaries (level, area_id, area_name, geometry)
    select
      'postcode_sector'                 as level,
      postcode_sector                   as area_id,
      postcode_sector                   as area_name,
      ST_Multi(
        ST_ConvexHull(
          ST_Collect(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geometry
          )
        )
      )::geometry(multipolygon, 4326)   as geometry
    from public.postcode_geography
    where postcode_sector  is not null
      and latitude  is not null
      and longitude is not null
    group by postcode_sector
    on conflict (level, area_id) do update set
      geometry = excluded.geometry,
      area_name = excluded.area_name
  `);
  console.log(
    `[boundaries] postcode_sector: ${sectorResult.rowCount} rows upserted (approx convex hulls)`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // --- validate at least one boundary file is provided ---
  const anyFile = LAD_PATH || MSOA_PATH || LSOA_PATH;
  if (!anyFile && !DERIVE_POSTCODE_AREAS) {
    console.error(
      "[boundaries] ERROR: No boundary files or derive flag provided.\n" +
      "\n" +
      "  Download ONS boundary GeoJSON files from:\n" +
      "    https://geoportal.statistics.gov.uk/\n" +
      "\n" +
      "  Recommended products (use Generalised / BGC for smaller file sizes):\n" +
      "    Local Authority Districts: 'Local Authority Districts Boundaries UK BGC'\n" +
      "    MSOA:                      'MSOA (December 2021) Boundaries EW BGC'\n" +
      "    LSOA:                      'LSOA (December 2021) Boundaries EW BGC'\n" +
      "\n" +
      "  Then run:\n" +
      "    node scripts/ingest-ons-boundaries.mjs \\\n" +
      "      --lad=/path/to/LAD_BGC.geojson \\\n" +
      "      --msoa=/path/to/MSOA_BGC.geojson \\\n" +
      "      --lsoa=/path/to/LSOA_BGC.geojson \\\n" +
      "      [--derive-postcode-areas] \\\n" +
      "      --commit\n" +
      "\n" +
      "  Or set env vars LAD_GEOJSON, MSOA_GEOJSON, LSOA_GEOJSON.\n",
    );
    process.exit(1);
  }

  // --- validate file paths ---
  for (const [label, p] of [["LAD", LAD_PATH], ["MSOA", MSOA_PATH], ["LSOA", LSOA_PATH]]) {
    if (p && !existsSync(resolve(p))) {
      console.error(`[boundaries] ERROR: ${label} file not found: ${resolve(p)}`);
      process.exit(1);
    }
  }

  // --- validate DB URL ---
  const dbUrl = loadDbUrl();
  if (!dbUrl) {
    console.error(
      "[boundaries] ERROR: SUPABASE_DB_URL not set.\n" +
      "  Add it to .env.local or set the environment variable.\n",
    );
    process.exit(1);
  }

  // --derive-postcode-areas without a DB connection (dry run) still needs
  // a DB to COUNT, so always connect regardless of COMMIT for that flag.
  const needsDb = COMMIT || DERIVE_POSTCODE_AREAS;

  console.log(`[boundaries] LAD file        : ${LAD_PATH  || "(not provided)"}`);
  console.log(`[boundaries] MSOA file       : ${MSOA_PATH || "(not provided)"}`);
  console.log(`[boundaries] LSOA file       : ${LSOA_PATH || "(not provided)"}`);
  console.log(`[boundaries] Derive pc areas : ${DERIVE_POSTCODE_AREAS}`);
  console.log(`[boundaries] Target DB       : ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`[boundaries] Mode            : ${COMMIT ? "COMMIT" : "DRY RUN (pass --commit to write)"}`);

  let client = null;
  if (needsDb) {
    client = new pg.Client({
      connectionString: dbUrl,
      ssl: { ca: loadCaCert(), rejectUnauthorized: true },
    });
    await client.connect();
    console.log("[boundaries] DB connected.");

    // Extend timeouts for potentially large geometry operations
    await client.query("SET statement_timeout = 0");
    await client.query("SET idle_in_transaction_session_timeout = 0");
  }

  try {
    let ladCodeToName = [];

    // --- LAD ---
    if (LAD_PATH) {
      ladCodeToName = await ingestGeoJSON(
        client, resolve(LAD_PATH), "local_authority", !COMMIT,
      );
    }

    // --- MSOA ---
    if (MSOA_PATH) {
      await ingestGeoJSON(client, resolve(MSOA_PATH), "msoa", !COMMIT);
    }

    // --- LSOA ---
    if (LSOA_PATH) {
      await ingestGeoJSON(client, resolve(LSOA_PATH), "lsoa", !COMMIT);
    }

    // --- Backfill lad_name in postcode_geography ---
    if (LAD_PATH) {
      await backfillLadNames(client, ladCodeToName, !COMMIT);
    }

    // --- Derive postcode-district / postcode-sector convex hulls ---
    if (DERIVE_POSTCODE_AREAS) {
      await derivePostcodeAreaBoundaries(client, !COMMIT);
    }

    // --- Final summary ---
    if (COMMIT && client) {
      const { rows } = await client.query(`
        select level, count(*)::int as n
        from public.geography_boundaries
        group by level
        order by n desc
      `);
      console.log("[boundaries] geography_boundaries now holds:");
      for (const r of rows) {
        console.log(`  ${r.level}: ${r.n.toLocaleString("en-GB")}`);
      }
    }
  } finally {
    if (client) await client.end();
  }

  console.log(`[boundaries] Done.${!COMMIT ? " Dry run — no writes. Pass --commit to ingest." : ""}`);
}

main().catch((err) => {
  console.error("[boundaries] FATAL:", err.message);
  process.exit(1);
});
