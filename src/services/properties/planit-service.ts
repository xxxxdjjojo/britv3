/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * PlanIt planning applications service.
 *
 * Fetches nearby planning applications from the PlanIt API
 * (https://www.planit.org.uk) — a free aggregator of UK council planning
 * application data.
 *
 * Results are Redis-cached for 24 hours. A 429 response writes a
 * `planit:ratelimited` negative-cache flag (Retry-After TTL, capped at 1h)
 * so subsequent calls short-circuit without hitting the API.
 *
 * TIMEOUT NOTE: This service uses a 10s timeout instead of the usual 5s.
 * PlanIt radius queries are slow (the server-side limit is 45s), and this
 * data renders inside a Suspense boundary so the longer wait never blocks
 * first paint.
 *
 * SECURITY NOTE: Coordinates are never included in user-facing error
 * messages or logs. Error logs emit only error_type (the Error constructor
 * name), never lat/lng or any PII.
 */

import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type PlanningStatus =
  | "Permitted"
  | "Conditions"
  | "Rejected"
  | "Withdrawn"
  | "Undecided"
  | "Referred"
  | "Unresolved"
  | "Other";

export type PlanningApplication = Readonly<{
  reference: string;
  description: string;
  address: string;
  status: PlanningStatus;
  app_type: string;
  start_date: string | null; // YYYY-MM-DD
  decided_date: string | null; // YYYY-MM-DD
  url: string;
  distance_km: number;
  authority: string;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLANIT_BASE_URL = "https://www.planit.org.uk/api/applics/json";
const CACHE_TTL_SECONDS = 86400; // 24 hr
const RATELIMIT_CACHE_KEY = "planit:ratelimited";
const RATELIMIT_DEFAULT_TTL_SECONDS = 300;
const RATELIMIT_MAX_TTL_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 10000; // see TIMEOUT NOTE in header

// ---------------------------------------------------------------------------
// Zod schemas for the PlanIt API response
// ---------------------------------------------------------------------------

/**
 * PlanIt returns `{ records: [...] }`. We validate only the fields we use,
 * keep everything optional/nullable (the upstream data is council-sourced
 * and inconsistent), and allow extra keys via `.passthrough()`.
 */
const PlanItRecordSchema = z
  .object({
    uid: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    app_state: z.string().nullable().optional(),
    app_type: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    decided_date: z.string().nullable().optional(),
    source_url: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    distance: z.union([z.number(), z.string()]).nullable().optional(),
    area_name: z.string().nullable().optional(),
  })
  .passthrough();

const PlanItResponseSchema = z
  .object({
    records: z.array(PlanItRecordSchema),
  })
  .passthrough();

type PlanItRecord = z.infer<typeof PlanItRecordSchema>;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Map a PlanIt app_state to our canonical status, case-insensitively. */
function normaliseStatus(raw: string | null | undefined): PlanningStatus {
  switch (raw?.trim().toLowerCase()) {
    case "permitted":   return "Permitted";
    case "conditions":  return "Conditions";
    case "rejected":    return "Rejected";
    case "withdrawn":   return "Withdrawn";
    case "undecided":   return "Undecided";
    case "referred":    return "Referred";
    case "unresolved":  return "Unresolved";
    default:            return "Other";
  }
}

/** Extract YYYY-MM-DD from a date string that may include a time component. */
function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  return match ? match[0] : null;
}

/** Parse a distance value that may arrive as a number or numeric string. */
function parseDistance(raw: number | string | null | undefined): number {
  if (raw === undefined || raw === null) return 0;
  const n = typeof raw === "number" ? raw : Number(raw);
  return isNaN(n) || n < 0 ? 0 : n;
}

/** Prefer the council's own page (source_url), then PlanIt's link/url. */
function pickUrl(record: PlanItRecord): string | null {
  return record.source_url || record.link || record.url || null;
}

/**
 * Transform a validated PlanIt record to our canonical type.
 * Returns null (record skipped) when uid or any usable url is missing.
 */
function transformRecord(record: PlanItRecord): PlanningApplication | null {
  const reference = record.uid?.trim();
  const url = pickUrl(record);
  if (!reference || !url) return null;

  return {
    reference,
    description: record.description?.trim() ?? "",
    address: record.address?.trim() ?? "Address not available",
    status: normaliseStatus(record.app_state),
    app_type: record.app_type?.trim() ?? "Unknown",
    start_date: parseDate(record.start_date),
    decided_date: parseDate(record.decided_date),
    url,
    distance_km: parseDistance(record.distance),
    authority: record.area_name?.trim() ?? "Unknown",
  };
}

/** Sort by start_date descending; applications without a date sort last. */
function compareByStartDateDesc(
  a: PlanningApplication,
  b: PlanningApplication,
): number {
  if (a.start_date === b.start_date) return 0;
  if (a.start_date === null) return 1;
  if (b.start_date === null) return -1;
  return b.start_date.localeCompare(a.start_date);
}

/** Parse a Retry-After header into a bounded negative-cache TTL. */
function parseRetryAfterTtl(header: string | null): number {
  const parsed = header ? parseInt(header, 10) : NaN;
  const ttl =
    isNaN(parsed) || parsed <= 0 ? RATELIMIT_DEFAULT_TTL_SECONDS : parsed;
  return Math.min(ttl, RATELIMIT_MAX_TTL_SECONDS);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch nearby planning applications for given coordinates.
 * Redis-cached for 24 hours. Returns null on any error — never throws.
 *
 * CRITICAL SECURITY: Coordinates are never included in error messages.
 * Logs emit only error_type (the Error class name).
 */
export async function fetchNearbyPlanningApplications(
  lat: number,
  lng: number,
  radiusKm = 0.5,
  limit = 10,
): Promise<PlanningApplication[] | null> {
  try {
    // Check explicit disable flag first
    const apiKey = process.env.PLANIT_API_KEY;
    if (apiKey === "disabled") {
      console.warn(
        "[planit-service] PLANIT_API_KEY set to 'disabled' — skipping fetch",
      );
      return null;
    }

    // Negative cache: a recent 429 short-circuits all calls
    const rateLimited = await getCached<boolean>(RATELIMIT_CACHE_KEY);
    if (rateLimited) {
      console.warn("[planit-service] Rate-limit flag active — skipping fetch");
      return null;
    }

    const cacheKey = `planit:lat:${lat.toFixed(3)}:lng:${lng.toFixed(3)}:r:${radiusKm}`;
    const cached = await getCached<PlanningApplication[]>(cacheKey);
    if (cached) return cached;

    const url = new URL(PLANIT_BASE_URL);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    url.searchParams.set("krad", String(radiusKm));
    url.searchParams.set("pg_sz", String(limit));
    url.searchParams.set("sort", "-start_date");

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (response.status === 429) {
      const ttl = parseRetryAfterTtl(response.headers.get("Retry-After"));
      console.warn("[planit-service] Rate limited (429)", { ttl });
      await setCache(RATELIMIT_CACHE_KEY, true, ttl);
      return null;
    }

    if (!response.ok) {
      console.warn("[planit-service] API error", {
        status: response.status,
      });
      return null;
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch (parseError) {
      console.error("[planit-service] JSON parse failed", {
        error_type: parseError instanceof Error ? parseError.name : "unknown",
      });
      return null;
    }

    const validated = PlanItResponseSchema.safeParse(raw);
    if (!validated.success) {
      console.error("[planit-service] Schema validation failed");
      return null;
    }

    const applications: PlanningApplication[] = [];
    for (const record of validated.data.records) {
      const application = transformRecord(record);
      if (application) applications.push(application);
    }

    applications.sort(compareByStartDateDesc);

    await setCache(cacheKey, applications, CACHE_TTL_SECONDS);
    return applications;
  } catch (error) {
    // AbortError (timeout), NetworkError, fetch-level failures, etc.
    console.error("[planit-service] Fetch failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
