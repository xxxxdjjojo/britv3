/**
 * PPD Comparables service — local database replacement for the external
 * Land Registry Linked Data API.
 *
 * Queries the price_paid_transactions table to find comparable sales near
 * a given postcode. Returns LandRegistryComparable[] so callers can swap
 * this in without changing their types.
 */

import type { LandRegistryComparable } from "./land-registry-service";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat/Maisonette",
  O: "Other",
};

const TENURE_LABELS: Record<string, string> = {
  F: "Freehold",
  L: "Leasehold",
  U: "Unknown",
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a human-readable address from PPD fields */
function buildAddress(row: {
  saon: string | null;
  paon: string | null;
  street: string | null;
  locality: string | null;
  town_city: string | null;
}): string {
  const parts = [row.saon, row.paon, row.street, row.locality, row.town_city].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  return parts.join(", ") || "Unknown address";
}

/** Internal row shape from price_paid_transactions */
type PpdRow = {
  id: string;
  price: number;
  transaction_date: string;
  postcode: string | null;
  property_type: string | null;
  is_new_build: boolean;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town_city: string | null;
};

const COMPARABLE_COLUMNS = "id, price, transaction_date, postcode, property_type, is_new_build, tenure, paon, saon, street, locality, town_city";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch comparable sales from local PPD data for a given postcode.
 *
 * Strategy: exact postcode first, then outward code (sector) fallback
 * to ensure enough results. Filters to Category A transactions only.
 *
 * @param postcode - Full UK postcode (e.g. "SW1A 2AA")
 * @param propertyType - Optional property type filter (D/S/T/F/O)
 * @param limit - Max results (default 20, capped at 50)
 * @returns LandRegistryComparable[] sorted by date descending, or null on error
 */
export async function getLocalComparables(
  postcode: string,
  propertyType?: string,
  limit?: number,
): Promise<LandRegistryComparable[] | null> {
  try {
    const supabase = await createClient();
    const effectiveLimit = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const normalised = postcode.toUpperCase().trim();

    // Extract outward code (everything before the space)
    const outwardCode = normalised.split(" ")[0];
    if (!outwardCode) {
      return null;
    }

    // Step 1: Try exact postcode match
    let query = supabase
      .from("price_paid_transactions")
      .select(COMPARABLE_COLUMNS)
      .eq("transaction_category", "A")
      .in("record_status", ["A", "C"])
      .ilike("postcode", normalised);

    if (propertyType) {
      query = query.eq("property_type", propertyType.toUpperCase());
    }

    const { data: exactData, error: exactError } = await query
      .order("transaction_date", { ascending: false })
      .limit(effectiveLimit);

    if (exactError) {
      console.error("[ppd-comparables-service] exact postcode query error:", {
        code: exactError.code,
        message: exactError.message,
      });
      return null;
    }

    let rows = (exactData ?? []) as PpdRow[];

    // Step 2: If not enough results, widen to outward code (sector)
    if (rows.length < effectiveLimit) {
      const remaining = effectiveLimit - rows.length;
      const existingIds = new Set(rows.map((r) => r.id));

      let widerQuery = supabase
        .from("price_paid_transactions")
        .select(COMPARABLE_COLUMNS)
        .eq("transaction_category", "A")
        .in("record_status", ["A", "C"])
        .ilike("postcode", `${outwardCode} %`)
        .neq("postcode", normalised); // Exclude already-fetched exact matches

      if (propertyType) {
        widerQuery = widerQuery.eq("property_type", propertyType.toUpperCase());
      }

      const { data: widerData, error: widerError } = await widerQuery
        .order("transaction_date", { ascending: false })
        .limit(remaining);

      if (!widerError && widerData) {
        const additional = (widerData as PpdRow[]).filter(
          (r) => !existingIds.has(r.id),
        );
        rows = [...rows, ...additional];
      }
    }

    // Transform to LandRegistryComparable
    return rows.map((row): LandRegistryComparable => ({
      address: buildAddress(row),
      price: row.price,
      date: row.transaction_date, // Already YYYY-MM-DD from Supabase
      property_type: PROPERTY_TYPE_LABELS[row.property_type ?? "O"] ?? "Other",
      new_build: row.is_new_build,
      tenure: TENURE_LABELS[row.tenure ?? "U"] ?? "Unknown",
    }));
  } catch (error) {
    console.error("[ppd-comparables-service] getLocalComparables unexpected error:", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
