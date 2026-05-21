/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Land Registry comparable sales service.
 *
 * Fetches nearby sold prices from the HM Land Registry Linked Data API.
 * Results are cached in Redis for 24 hours to avoid hammering the public API.
 *
 * SECURITY NOTE: Postcodes are never included in user-facing error messages.
 * Error logs emit only error_type (the Error constructor name), never the
 * postcode, address, or any PII.
 */

import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LandRegistryComparable = Readonly<{
  address: string;
  price: number;
  date: string; // YYYY-MM-DD
  property_type: string;
  new_build: boolean;
  tenure: string;
}>;

// ---------------------------------------------------------------------------
// Zod schemas for the Land Registry JSON-LD response
// ---------------------------------------------------------------------------

/**
 * The Land Registry Linked Data API returns a JSON-LD envelope with a
 * `result` wrapper containing an array of `items`. Each item carries the
 * transaction details as nested objects. We validate only the fields we
 * actually use and allow extra keys everywhere via `.passthrough()`.
 */

const LandRegistryTransactionSchema = z
  .object({
    // Primary address fields returned inline
    "ppi:propertyAddress": z
      .object({
        "ppi:paon": z.union([z.string(), z.object({ value: z.string() })]).optional(),
        "ppi:saon": z.union([z.string(), z.object({ value: z.string() })]).optional(),
        "ppi:street": z.union([z.string(), z.object({ value: z.string() })]).optional(),
        "ppi:town": z.union([z.string(), z.object({ value: z.string() })]).optional(),
        "ppi:postcode": z.union([z.string(), z.object({ value: z.string() })]).optional(),
      })
      .passthrough()
      .optional(),
    "ppi:transactionDate": z
      .union([z.string(), z.object({ value: z.string() })])
      .optional(),
    "ppi:pricePaid": z
      .union([
        z.number(),
        z.object({ value: z.union([z.number(), z.string()]) }),
      ])
      .optional(),
    "ppi:propertyType": z
      .union([z.string(), z.object({ value: z.string() })])
      .optional(),
    "ppi:newBuild": z
      .union([z.boolean(), z.string(), z.object({ value: z.union([z.boolean(), z.string()]) })])
      .optional(),
    "ppi:tenure": z
      .union([z.string(), z.object({ value: z.string() })])
      .optional(),
  })
  .passthrough();

const LandRegistryResponseSchema = z
  .object({
    result: z
      .object({
        items: z.array(LandRegistryTransactionSchema).default([]),
      })
      .passthrough()
      .optional(),
    // Some endpoints return items at root level
    items: z.array(LandRegistryTransactionSchema).optional(),
  })
  .passthrough();

type LandRegistryResponse = z.infer<typeof LandRegistryResponseSchema>;
type LandRegistryTransaction = z.infer<typeof LandRegistryTransactionSchema>;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Unwrap a value that may be a primitive or a JSON-LD `{ value: T }` box. */
function unwrap<T>(v: T | { value: T } | undefined): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object" && v !== null && "value" in (v as object)) {
    return (v as { value: T }).value;
  }
  return v as T;
}

/** Normalise a Land Registry property type code to a human-readable label. */
function normalisePropertyType(raw: string | undefined): string {
  switch (raw?.toUpperCase()) {
    case "D": return "Detached";
    case "S": return "Semi-detached";
    case "T": return "Terraced";
    case "F": return "Flat/Maisonette";
    case "O": return "Other";
    default:  return raw ?? "Unknown";
  }
}

/** Normalise a Land Registry tenure code to a human-readable label. */
function normaliseTenure(raw: string | undefined): string {
  switch (raw?.toUpperCase()) {
    case "F": return "Freehold";
    case "L": return "Leasehold";
    default:  return raw ?? "Unknown";
  }
}

/** Parse a price value that may arrive as a number or numeric string. */
function parsePrice(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return isNaN(n) || n <= 0 ? null : n;
}

/** Extract YYYY-MM-DD from a date string that may include a time component. */
function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  return match ? match[0] : null;
}

/** Build a human-readable address string from Land Registry address fields. */
function buildAddress(
  addr: LandRegistryTransaction["ppi:propertyAddress"],
): string {
  if (!addr) return "Unknown address";

  const parts = [
    unwrap(addr["ppi:paon"]),
    unwrap(addr["ppi:saon"]),
    unwrap(addr["ppi:street"]),
    unwrap(addr["ppi:town"]),
  ].filter((p): p is string => Boolean(p));

  return parts.join(", ") || "Unknown address";
}

/** Transform validated Land Registry items to our canonical type. */
function transformToComparables(
  data: LandRegistryResponse,
): LandRegistryComparable[] {
  const items = data.result?.items ?? data.items ?? [];

  const comparables: LandRegistryComparable[] = [];

  for (const item of items) {
    const price = parsePrice(
      unwrap(item["ppi:pricePaid"] as number | { value: number } | undefined),
    );
    const date = parseDate(
      unwrap(item["ppi:transactionDate"] as string | { value: string } | undefined),
    );

    // Skip transactions with missing critical fields
    if (!price || !date) continue;

    const rawNewBuild = unwrap(
      item["ppi:newBuild"] as boolean | string | { value: boolean | string } | undefined,
    );
    const newBuild =
      rawNewBuild === true ||
      String(rawNewBuild).toUpperCase() === "Y" ||
      String(rawNewBuild).toUpperCase() === "TRUE";

    comparables.push({
      address: buildAddress(item["ppi:propertyAddress"]),
      price,
      date,
      property_type: normalisePropertyType(
        unwrap(item["ppi:propertyType"] as string | { value: string } | undefined),
      ),
      new_build: newBuild,
      tenure: normaliseTenure(
        unwrap(item["ppi:tenure"] as string | { value: string } | undefined),
      ),
    });
  }

  // Sort by date descending (most recent first)
  return comparables.sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch Land Registry comparable sales for a postcode.
 * Redis-cached for 24 hours. Returns null on any error — never throws.
 *
 * CRITICAL SECURITY: Postcodes are never included in error messages surfaced
 * to users. Logs emit only error_type (the Error class name).
 */
export async function fetchLandRegistryComparables(
  postcode: string,
): Promise<LandRegistryComparable[] | null> {
  try {
    const cacheKey = `lr:postcode:${postcode}`;
    const cached = await getCached<LandRegistryComparable[]>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.LAND_REGISTRY_API_KEY;
    // undefined/empty = use public endpoint (Land Registry data.gov.uk is public)
    // "disabled" = integration explicitly disabled (return null)
    if (apiKey === "disabled") {
      console.warn(
        "[land-registry-service] LAND_REGISTRY_API_KEY set to 'disabled' — skipping fetch",
      );
      return null;
    }

    const url = new URL(
      "https://api.landregistry.data.gov.uk/linked-data/resource/ppi/transactions-by-postcode",
    );
    url.searchParams.set("postcode", postcode);
    url.searchParams.set("_limit", "20");

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers,
    });

    if (!response.ok) {
      console.warn("[land-registry-service] API error", {
        status: response.status,
      });
      return null;
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch (parseError) {
      console.error("[land-registry-service] JSON parse failed", {
        error_type: parseError instanceof Error ? parseError.name : "unknown",
      });
      return null;
    }

    const validated = LandRegistryResponseSchema.safeParse(raw);
    if (!validated.success) {
      console.error("[land-registry-service] Schema validation failed");
      return null;
    }

    const comparables = transformToComparables(validated.data);
    await setCache(cacheKey, comparables, 86400); // 24 hr
    return comparables;
  } catch (error) {
    // AbortError (timeout), NetworkError, fetch-level failures, etc.
    console.error("[land-registry-service] Fetch failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
