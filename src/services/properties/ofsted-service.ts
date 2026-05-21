/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Ofsted / GIAS (Get Information About Schools) service.
 *
 * Fetches nearby schools from the DfE GIAS API — a free public API covering
 * all state-funded schools in England and Wales.
 *
 * Results are Redis-cached for 7 days (school ratings change infrequently).
 *
 * SECURITY NOTE: Coordinates are never included in user-facing error messages.
 * Error logs emit only error_type (the Error constructor name), never lat/lng
 * or any PII.
 */

import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OfstedSchool = Readonly<{
  name: string;
  type: string; // "Primary" | "Secondary" | "Special" etc.
  rating:
    | "Outstanding"
    | "Good"
    | "Requires improvement"
    | "Inadequate"
    | "Not yet inspected";
  distance_miles: number;
  address: string;
  ofsted_id: string;
}>;

// ---------------------------------------------------------------------------
// Zod schemas for the GIAS API response
// ---------------------------------------------------------------------------

/**
 * GIAS returns an array of establishment objects. We validate only the
 * fields we use and allow extra keys via `.passthrough()`.
 */
const GiasSchoolSchema = z
  .object({
    Urn: z.union([z.number(), z.string()]).optional(),
    EstablishmentName: z.string().optional(),
    TypeOfEstablishment: z
      .object({
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
    OfstedRating: z
      .object({
        name: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
    // Address fields
    Street: z.string().optional(),
    Town: z.string().optional(),
    Postcode: z.string().optional(),
    // Distance returned by the radius search
    DistanceInMiles: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

const GiasResponseSchema = z
  .object({
    Establishments: z.array(GiasSchoolSchema).optional(),
    // Some response shapes wrap in `establishments` (lowercase)
    establishments: z.array(GiasSchoolSchema).optional(),
  })
  .passthrough();

type GiasSchool = z.infer<typeof GiasSchoolSchema>;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Map a GIAS OfstedRating.name string to our canonical rating label. */
function normaliseRating(
  raw: string | null | undefined,
): OfstedSchool["rating"] {
  if (!raw) return "Not yet inspected";
  const normalised = raw.trim().toLowerCase();
  if (normalised === "outstanding") return "Outstanding";
  if (normalised === "good") return "Good";
  if (
    normalised === "requires improvement" ||
    normalised === "satisfactory" // older Ofsted label
  )
    return "Requires improvement";
  if (normalised === "inadequate") return "Inadequate";
  return "Not yet inspected";
}

/** Build a short address string from GIAS address fields. */
function buildAddress(school: GiasSchool): string {
  const parts = [school.Street, school.Town, school.Postcode].filter(
    (p): p is string => Boolean(p),
  );
  return parts.join(", ") || "Address not available";
}

/** Parse a distance value that may arrive as a number or numeric string. */
function parseDistance(raw: number | string | undefined): number {
  if (raw === undefined || raw === null) return 0;
  const n = typeof raw === "number" ? raw : Number(raw);
  return isNaN(n) || n < 0 ? 0 : Math.round(n * 10) / 10;
}

/** Transform a validated GIAS school item to our canonical OfstedSchool type. */
function transformSchool(school: GiasSchool): OfstedSchool | null {
  const name = school.EstablishmentName?.trim();
  const ofstedId = String(school.Urn ?? "").trim();
  if (!name || !ofstedId) return null;

  return {
    name,
    type: school.TypeOfEstablishment?.name?.trim() ?? "Unknown",
    rating: normaliseRating(school.OfstedRating?.name),
    distance_miles: parseDistance(school.DistanceInMiles),
    address: buildAddress(school),
    ofsted_id: ofstedId,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch nearby Ofsted-rated schools for given coordinates.
 * Redis-cached for 7 days (604800 seconds). Returns null on any error —
 * never throws.
 *
 * CRITICAL SECURITY: Coordinates are never included in error messages.
 * Logs emit only error_type (the Error class name).
 */
export async function fetchNearbySchools(
  lat: number,
  lng: number,
  radiusMiles = 1,
): Promise<OfstedSchool[] | null> {
  try {
    // Check explicit disable flag first
    const apiKey = process.env.OFSTED_API_KEY;
    if (apiKey === "disabled") {
      console.warn(
        "[ofsted-service] OFSTED_API_KEY set to 'disabled' — skipping fetch",
      );
      return null;
    }

    const cacheKey = `ofsted:lat:${lat.toFixed(3)}:lng:${lng.toFixed(3)}:r:${radiusMiles}`;
    const cached = await getCached<OfstedSchool[]>(cacheKey);
    if (cached) return cached;

    const url = new URL(
      "https://api.get-information-about-schools.service.gov.uk/api/schools/search",
    );
    url.searchParams.set("la", "");
    url.searchParams.set("radius", String(radiusMiles));
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("limit", "10");

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers,
    });

    if (!response.ok) {
      console.warn("[ofsted-service] API error", {
        status: response.status,
      });
      return null;
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch (parseError) {
      console.error("[ofsted-service] JSON parse failed", {
        error_type:
          parseError instanceof Error ? parseError.name : "unknown",
      });
      return null;
    }

    // The GIAS API returns an array directly for some endpoints,
    // or an object with Establishments/establishments key for others.
    // Normalise to array before Zod validation.
    const rawNormalised = Array.isArray(raw)
      ? { Establishments: raw }
      : raw;

    const validated = GiasResponseSchema.safeParse(rawNormalised);
    if (!validated.success) {
      console.error("[ofsted-service] Schema validation failed");
      return null;
    }

    const items =
      validated.data.Establishments ??
      validated.data.establishments ??
      [];

    const schools: OfstedSchool[] = [];
    for (const item of items) {
      const school = transformSchool(item);
      if (school) schools.push(school);
    }

    // Sort by distance ascending
    schools.sort((a, b) => a.distance_miles - b.distance_miles);

    await setCache(cacheKey, schools, 604800); // 7 days
    return schools;
  } catch (error) {
    // AbortError (timeout), NetworkError, fetch-level failures, etc.
    console.error("[ofsted-service] Fetch failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
