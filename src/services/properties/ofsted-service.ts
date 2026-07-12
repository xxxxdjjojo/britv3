/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Nearby Ofsted-rated schools for the property-detail Local Area widget.
 *
 * Data is served from our own `schools` table (GIAS/Ofsted open data,
 * OGL v3.0), queried via the get_nearby_schools PostGIS RPC. The table is
 * populated out-of-band by scripts/ingest-gias-schools.mjs.
 *
 * Returns null on any error or when there is no nearby data, so callers degrade
 * by absence (never render an empty widget). Coordinates are never echoed in
 * error logs.
 */

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OfstedSchool = Readonly<{
  name: string;
  type: string; // e.g. "Primary", "Secondary", "Special"
  rating: "Outstanding" | "Good" | "Requires improvement" | "Inadequate" | null;
  distance_miles: number;
  address: string;
  ofsted_id: string;
}>;

// ---------------------------------------------------------------------------
// Private constants
// ---------------------------------------------------------------------------

const METERS_PER_MILE = 1609.344;
const DEFAULT_RADIUS_METERS = 4800;
const MAX_RESULTS = 6;

const VALID_RATINGS: ReadonlySet<NonNullable<OfstedSchool["rating"]>> = new Set([
  "Outstanding",
  "Good",
  "Requires improvement",
  "Inadequate",
]);

// ---------------------------------------------------------------------------
// Row type returned by the RPC
// ---------------------------------------------------------------------------

type NearbySchoolRow = {
  name: string;
  phase: string | null;
  establishment_type: string | null;
  ofsted_rating: string | null;
  street: string | null;
  locality: string | null;
  town: string | null;
  postcode: string | null;
  urn: string;
  distance_meters: number;
};

// ---------------------------------------------------------------------------
// Pure mapper (exported for unit tests)
// ---------------------------------------------------------------------------

/** Map a validated RPC row to the widget's OfstedSchool, or null if malformed. */
export function toOfstedSchool(row: NearbySchoolRow): OfstedSchool | null {
  if (!row.name || !row.urn) return null;

  const type = row.phase ?? row.establishment_type ?? "School";

  const rawRating = row.ofsted_rating;
  const rating =
    rawRating !== null && VALID_RATINGS.has(rawRating as NonNullable<OfstedSchool["rating"]>)
      ? (rawRating as NonNullable<OfstedSchool["rating"]>)
      : null;

  const miles = row.distance_meters / METERS_PER_MILE;

  const address = [row.street, row.town, row.postcode]
    .filter((p): p is string => Boolean(p))
    .join(", ");

  return {
    name: row.name,
    type,
    rating,
    distance_miles: Math.round(miles * 10) / 10,
    address,
    ofsted_id: row.urn,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch nearby Ofsted-rated schools for given coordinates.
 * Returns null on any error or when there is no data — never throws.
 *
 * SECURITY: Coordinates are never included in error logs.
 * Logs emit only error_type (the Error class name) or the RPC error code.
 */
export async function fetchNearbySchools(
  lat: number,
  lng: number,
): Promise<OfstedSchool[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_nearby_schools", {
      center_lat: lat,
      center_lng: lng,
      radius_meters: DEFAULT_RADIUS_METERS,
      max_results: MAX_RESULTS,
    });

    if (error) {
      console.error("[ofsted-service] RPC failed", {
        error_type: error.code ?? "unknown",
      });
      return null;
    }

    const rows = (data ?? []) as NearbySchoolRow[];
    const schools = rows
      .map(toOfstedSchool)
      .filter((s): s is OfstedSchool => s !== null);

    return schools.length > 0 ? schools : null;
  } catch (error) {
    console.error("[ofsted-service] Lookup failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
