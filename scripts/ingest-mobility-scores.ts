/**
 * scripts/ingest-mobility-scores.ts
 *
 * Precomputes walk / transit / bike "mobility scores" per property into
 * public.mobility_scores, so the property-detail Mobility widget reads them
 * instantly (Overpass is too unreliable to call live at render time).
 *
 * Per property with coordinates:
 *   - Walk & Bike: OpenStreetMap amenities + cycle infrastructure within
 *     ~1500 m via the Overpass API (ODbL). Mirror fallback + polite pacing.
 *   - Transit: our own transport_stops via the get_nearby_transport_stops RPC
 *     (NaPTAN/DfT, OGL v3.0).
 * Scores are computed by the shared, unit-tested src/lib/properties/
 * mobility-scoring module — no duplicated logic.
 *
 * Idempotent: upserts on property_id; skips properties already scored unless
 * --force. Dry-run by default; --commit to write; --limit N to cap; --force to
 * recompute. Run with Node's type stripping:
 *   node --experimental-strip-types scripts/ingest-mobility-scores.ts
 *   node --experimental-strip-types scripts/ingest-mobility-scores.ts --commit
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  computeWalkScore,
  computeTransitScore,
  computeBikeScore,
  haversineMeters,
  type AmenityCategory,
  type WalkAmenity,
  type TransitMode,
  type TransitStop,
} from "../src/lib/properties/mobility-scoring.ts";

const COMMIT = process.argv.includes("--commit");
const FORCE = process.argv.includes("--force");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX !== -1 ? Number(process.argv[LIMIT_IDX + 1]) : null;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const RADIUS_M = 1500;
const PACE_MS = 1200; // polite delay between properties (shared Overpass API)
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];
const UA = "Britestate-PropertyPortal/1.0 (mobility-scores ingest)";

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// OSM tag → amenity category
// ---------------------------------------------------------------------------

function classifyAmenity(tags: Record<string, string>): AmenityCategory | null {
  const shop = tags.shop;
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  if (shop === "supermarket" || shop === "convenience" || shop === "greengrocer" || amenity === "marketplace") return "grocery";
  if (amenity === "restaurant" || amenity === "cafe" || amenity === "fast_food" || amenity === "pub" || amenity === "bar") return "food";
  if (amenity === "school" || amenity === "kindergarten" || amenity === "college" || amenity === "university") return "school";
  if (amenity === "pharmacy" || amenity === "hospital" || amenity === "clinic" || amenity === "doctors" || amenity === "dentist") return "health";
  if (leisure === "park" || leisure === "garden" || leisure === "playground" || leisure === "recreation_ground") return "park";
  if (shop) return "retail";
  return null;
}

const TRANSIT_MODES: ReadonlySet<TransitMode> = new Set(["rail", "tube", "tram", "ferry", "bus"]);

// ---------------------------------------------------------------------------
// Overpass
// ---------------------------------------------------------------------------

type OverpassElement = {
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
};

function overpassQuery(lat: number, lng: number): string {
  const a = `around:${RADIUS_M},${lat},${lng}`;
  return (
    `[out:json][timeout:25];(` +
    `nwr(${a})["shop"];` +
    `nwr(${a})["amenity"~"^(restaurant|cafe|fast_food|pub|bar|marketplace|school|kindergarten|college|university|pharmacy|hospital|clinic|doctors|dentist|bicycle_parking)$"];` +
    `nwr(${a})["leisure"~"^(park|garden|playground|recreation_ground)$"];` +
    `way(${a})["highway"="cycleway"];` +
    `way(${a})["cycleway"];` +
    `);out tags center;`
  );
}

async function fetchOverpass(lat: number, lng: number): Promise<OverpassElement[] | null> {
  const data = overpassQuery(lat, lng);
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data }),
        signal: AbortSignal.timeout(40000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch {
      // try next mirror
    }
  }
  return null;
}

function elementLatLng(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  if (typeof el.lat === "number" && typeof el.lon === "number") return { lat: el.lat, lng: el.lon };
  return null;
}

// ---------------------------------------------------------------------------
// Per-property scoring
// ---------------------------------------------------------------------------

type PropertyRow = { id: string; lat: number; lng: number };

type Scores = {
  walk: number;
  transit: number;
  bike: number;
  walkAmenityCount: number;
  transitStopCount: number;
  bikeCyclewayCount: number;
};

async function scoreProperty(
  client: pg.Client,
  prop: PropertyRow,
): Promise<Scores | null> {
  const elements = await fetchOverpass(prop.lat, prop.lng);
  if (elements === null) return null; // Overpass unavailable — skip, retry on a later run

  const amenities: WalkAmenity[] = [];
  let cyclewayCount = 0;
  let bikeParkingCount = 0;
  for (const el of elements) {
    const tags = el.tags ?? {};
    if (tags.highway === "cycleway" || tags.cycleway) {
      cyclewayCount += 1;
      continue;
    }
    if (tags.amenity === "bicycle_parking") {
      bikeParkingCount += 1;
      continue;
    }
    const category = classifyAmenity(tags);
    const pos = elementLatLng(el);
    if (!category || !pos) continue;
    amenities.push({
      category,
      distanceMeters: haversineMeters(prop.lat, prop.lng, pos.lat, pos.lng),
    });
  }

  // Transit from our own NaPTAN-backed transport_stops.
  const { rows } = await client.query<{ stop_type: string; distance_meters: number }>(
    "select stop_type, distance_meters from get_nearby_transport_stops($1, $2, $3, 12)",
    [prop.lat, prop.lng, RADIUS_M],
  );
  const stops: TransitStop[] = rows
    .filter((r) => TRANSIT_MODES.has(r.stop_type as TransitMode))
    .map((r) => ({ mode: r.stop_type as TransitMode, distanceMeters: Number(r.distance_meters) }));

  return {
    walk: computeWalkScore(amenities),
    transit: computeTransitScore(stops),
    bike: computeBikeScore({ cyclewayCount, bikeParkingCount, amenityCount: amenities.length }),
    walkAmenityCount: amenities.length,
    transitStopCount: stops.length,
    bikeCyclewayCount: cyclewayCount,
  };
}

async function upsert(client: pg.Client, propertyId: string, s: Scores): Promise<void> {
  await client.query(
    `insert into public.mobility_scores
       (property_id, walk_score, transit_score, bike_score,
        walk_amenity_count, transit_stop_count, bike_cycleway_count, computed_at)
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (property_id) do update set
       walk_score = excluded.walk_score,
       transit_score = excluded.transit_score,
       bike_score = excluded.bike_score,
       walk_amenity_count = excluded.walk_amenity_count,
       transit_stop_count = excluded.transit_stop_count,
       bike_cycleway_count = excluded.bike_cycleway_count,
       computed_at = now()`,
    [propertyId, s.walk, s.transit, s.bike, s.walkAmenityCount, s.transitStopCount, s.bikeCyclewayCount],
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dbUrl = loadDbUrl();
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not set (env or .env.local).");

  const client = new pg.Client({ connectionString: dbUrl, ssl: { ca: loadCaCert(), rejectUnauthorized: true } });
  await client.connect();
  try {
    const where = FORCE
      ? "p.coordinates is not null"
      : "p.coordinates is not null and m.property_id is null";
    const { rows: props } = await client.query<PropertyRow>(
      `select p.id,
              st_y(p.coordinates::geometry) as lat,
              st_x(p.coordinates::geometry) as lng
         from public.properties p
         left join public.mobility_scores m on m.property_id = p.id
        where ${where}
        order by p.id
        ${LIMIT ? `limit ${LIMIT}` : ""}`,
    );
    console.log(
      `${props.length} propert${props.length === 1 ? "y" : "ies"} to score` +
        `${FORCE ? " (--force)" : " (missing scores)"}.${COMMIT ? "" : " Dry run — no writes."}`,
    );

    let done = 0;
    let skipped = 0;
    for (const prop of props) {
      const scores = await scoreProperty(client, prop);
      if (!scores) {
        skipped += 1;
        console.warn(`  skip ${prop.id} — Overpass unavailable (will retry on re-run)`);
      } else {
        console.log(
          `  ${COMMIT ? "scored" : "would score"} ${prop.id}: ` +
            `walk ${scores.walk} · transit ${scores.transit} · bike ${scores.bike} ` +
            `(${scores.walkAmenityCount} amenities, ${scores.transitStopCount} stops, ${scores.bikeCyclewayCount} cycleways)`,
        );
        if (COMMIT) await upsert(client, prop.id, scores);
        done += 1;
      }
      await sleep(PACE_MS);
    }
    console.log(`Done. ${done} ${COMMIT ? "written" : "computed"}, ${skipped} skipped.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
