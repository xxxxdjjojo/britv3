/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use server";

import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features";
import { getMockSearchProperties, PROPERTY_TYPE_MAP, PROPERTY_TYPE_REVERSE } from "@/lib/mock-data/listings";
import type { SoldWithin } from "@/lib/search/url-state";
import { computeSoldSince } from "@/lib/search/sold-within";
import type { SearchProperty } from "@/lib/search/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { SearchProperty } from "@/lib/search/types";

export type SearchFilters = {
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  bedsMin?: string;
  bedsMax?: string;
  soldWithin?: SoldWithin;
  propertyType?: string[];
  mustHaves?: string[];
  minSqft?: string;
  maxSqft?: string;
  sort?: string;
  q?: string;
  // --- Lettings filters (rent-only; string-typed to match SearchState values) ---
  furnishing?: string;
  billsIncluded?: string;
  petsAllowed?: string;
  studentsWelcome?: string;
  letAgreed?: string;
  availableFrom?: string;
  minTenancyMonths?: string;
};

// ---------------------------------------------------------------------------
// Client-side filter for mock data (mirrors the Supabase query logic)
// ---------------------------------------------------------------------------

function rankBedsMin(value: string | undefined): number | null {
  if (!value || value === "Any") return null;
  if (value === "5+") return 5;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function rankBeds(value: string | undefined): number | null {
  if (!value || value === "Any") return null;
  if (value === "5+") return null; // sentinel: no upper bound
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function filterMockProperties(filters: SearchFilters): SearchProperty[] {
  let results = getMockSearchProperties();

  // Listing type
  if (filters.listingType && filters.listingType !== "all") {
    // Map UI listing types to the mock data's listing_type values
    // "new_build", "commercial", "land", "auction" don't exist in mock data,
    // so those will return empty results (correct behavior)
    const lt = filters.listingType === "sale" || filters.listingType === "rent"
      ? filters.listingType
      : null;
    if (lt) {
      results = results.filter((p) => p.listing_type === lt);
    } else {
      results = [];
    }
  }

  // Price range
  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!isNaN(min)) results = results.filter((p) => p.price >= min);
  }
  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!isNaN(max)) results = results.filter((p) => p.price <= max);
  }

  // Bedrooms — min/max range
  const minBedsRank = rankBedsMin(filters.bedsMin);
  const maxBedsRank = rankBeds(filters.bedsMax);
  if (minBedsRank !== null) {
    results = results.filter((p) => p.beds >= minBedsRank);
  }
  if (maxBedsRank !== null) {
    results = results.filter((p) => p.beds <= maxBedsRank);
  }

  // Sold within last N months — runs against last_sold_date.
  if (filters.soldWithin && filters.soldWithin !== "all") {
    const floor = computeSoldSince(filters.soldWithin);
    if (floor) {
      results = results.filter(
        (p) => p.last_sold_date !== null && p.last_sold_date >= floor,
      );
    }
  }

  // Property type
  if (filters.propertyType && filters.propertyType.length > 0) {
    results = results.filter((p) => filters.propertyType!.includes(p.type));
  }

  // Living area (sqft)
  if (filters.minSqft) {
    const min = Number(filters.minSqft);
    if (!isNaN(min)) results = results.filter((p) => p.sqft >= min);
  }
  if (filters.maxSqft) {
    const max = Number(filters.maxSqft);
    if (!isNaN(max)) results = results.filter((p) => p.sqft <= max);
  }

  // Lettings filters — rent-only. Each predicate applies only when its filter
  // value is set/non-neutral, so an untouched lettings panel narrows nothing.
  if (filters.listingType === "rent") {
    if (filters.furnishing && filters.furnishing !== "any") {
      results = results.filter((p) => p.furnishing === filters.furnishing);
    }
    if (filters.billsIncluded === "yes") {
      results = results.filter((p) => p.bills_included === true);
    } else if (filters.billsIncluded === "no") {
      results = results.filter((p) => p.bills_included === false);
    }
    if (filters.petsAllowed === "yes") {
      results = results.filter(
        (p) => p.pets_policy === "allowed" || p.pets_policy === "by_arrangement",
      );
    } else if (filters.petsAllowed === "no") {
      results = results.filter((p) => p.pets_policy === "not_allowed");
    }
    if (filters.studentsWelcome === "yes") {
      results = results.filter(
        (p) =>
          p.students_policy === "accepted" ||
          p.students_policy === "by_arrangement",
      );
    } else if (filters.studentsWelcome === "no") {
      results = results.filter((p) => p.students_policy === "not_accepted");
    }
    if (filters.letAgreed === "exclude") {
      results = results.filter((p) => p.let_agreed !== true);
    }
    if (filters.availableFrom) {
      // ISO date strings compare lexicographically (correct for YYYY-MM-DD):
      // keep lets available on or before the chosen date.
      const by = filters.availableFrom;
      results = results.filter(
        (p) => p.available_from != null && p.available_from <= by,
      );
    }
    const maxTenancy = Number(filters.minTenancyMonths);
    if (filters.minTenancyMonths && maxTenancy > 0) {
      results = results.filter(
        (p) =>
          p.minimum_tenancy_months != null &&
          p.minimum_tenancy_months <= maxTenancy,
      );
    }
  }

  // Sort — every option deterministically reorders mock results (ids are
  // numeric, standing in for the recency/popularity the mock set lacks).
  if (filters.sort === "price_asc") {
    results.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "price_desc") {
    results.sort((a, b) => b.price - a.price);
  } else if (filters.sort === "most_recent") {
    results.sort((a, b) => Number(b.id) - Number(a.id));
  } else if (filters.sort === "most_popular") {
    results.sort((a, b) => Number(a.id) - Number(b.id));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Server action: searchProperties
// ---------------------------------------------------------------------------

export async function searchProperties(
  filters: SearchFilters,
): Promise<{ data: SearchProperty[]; error: string | null }> {
  // Feature flag gate — return empty results when live data is disabled.
  // Do NOT fabricate mock listings (data integrity per master prompt §HARD RULES).
  if (!isFeatureEnabled("search_live_data")) {
    // Dev/demo only: when search_mock_data is on (never in production), serve the
    // canonical mock dataset so the search grid is populated for local QA. With
    // both flags off (production default) we return EMPTY and never fabricate
    // listings for real users — preserving the data-integrity rule.
    if (isFeatureEnabled("search_mock_data")) {
      return { data: filterMockProperties(filters), error: null };
    }
    return { data: [], error: null };
  }

  try {
    const supabase = await createClient();

    // Query the search_listings materialized view
    let query = supabase
      .from("search_listings")
      .select("listing_id, property_id, listing_type, price, property_type, bedrooms, bathrooms, city, postcode, coordinates, slug, thumbnail_url, title, address_line1, square_footage, epc_rating, tenure, last_sold_date")
      .limit(50);

    // Listing type filter
    if (filters.listingType && filters.listingType !== "all") {
      // Only "sale" and "rent" are valid DB enum values
      if (filters.listingType === "sale" || filters.listingType === "rent") {
        query = query.eq("listing_type", filters.listingType);
      } else if (filters.listingType === "new_build") {
        query = query.eq("new_build", true);
      }
      // "commercial", "land", "auction" would need extended schema support
    }

    // Price range
    if (filters.minPrice) {
      const min = Number(filters.minPrice);
      if (!isNaN(min)) query = query.gte("price", min);
    }
    if (filters.maxPrice) {
      const max = Number(filters.maxPrice);
      if (!isNaN(max)) query = query.lte("price", max);
    }

    // Bedrooms — min/max range
    const minBeds = rankBedsMin(filters.bedsMin);
    const maxBeds = rankBeds(filters.bedsMax);
    if (minBeds !== null) query = query.gte("bedrooms", minBeds);
    if (maxBeds !== null) query = query.lte("bedrooms", maxBeds);

    // Sold within last N months
    if (filters.soldWithin && filters.soldWithin !== "all") {
      const floor = computeSoldSince(filters.soldWithin);
      if (floor) query = query.gte("last_sold_date", floor);
    }

    // Living area (sqft)
    if (filters.minSqft) {
      const min = Number(filters.minSqft);
      if (!isNaN(min)) query = query.gte("square_footage", min);
    }
    if (filters.maxSqft) {
      const max = Number(filters.maxSqft);
      if (!isNaN(max)) query = query.lte("square_footage", max);
    }

    // Lettings filters — flagged OFF by default. These columns are not in the
    // search_listings MV yet, so search_rental_filters stays OFF until the MV
    // carries them; with the flag off the live query is byte-for-byte unchanged.
    if (
      isFeatureEnabled("search_rental_filters") &&
      filters.listingType === "rent"
    ) {
      if (filters.furnishing && filters.furnishing !== "any") {
        query = query.eq("furnishing", filters.furnishing);
      }
      if (filters.billsIncluded === "yes") {
        query = query.eq("bills_included", true);
      } else if (filters.billsIncluded === "no") {
        query = query.eq("bills_included", false);
      }
      if (filters.petsAllowed === "yes") {
        query = query.in("pets_policy", ["allowed", "by_arrangement"]);
      } else if (filters.petsAllowed === "no") {
        query = query.eq("pets_policy", "not_allowed");
      }
      if (filters.studentsWelcome === "yes") {
        query = query.in("students_policy", ["accepted", "by_arrangement"]);
      } else if (filters.studentsWelcome === "no") {
        query = query.eq("students_policy", "not_accepted");
      }
      if (filters.letAgreed === "exclude") {
        // NOTE: when enabled, use a NULL-safe form (e.g. `.or("let_agreed.is.null,let_agreed.eq.false")`)
        // to match mock semantics — `.neq("let_agreed", true)` excludes NULL rows in Postgres.
        query = query.neq("let_agreed", true);
      }
      if (filters.availableFrom) {
        query = query.lte("available_from", filters.availableFrom);
      }
      const maxTenancy = Number(filters.minTenancyMonths);
      if (filters.minTenancyMonths && maxTenancy > 0) {
        query = query.lte("minimum_tenancy_months", maxTenancy);
      }
    }

    // Property type (cast enum to text for .in() filter)
    if (filters.propertyType && filters.propertyType.length > 0) {
      const dbTypes = filters.propertyType
        .map((t) => PROPERTY_TYPE_MAP[t])
        .filter(Boolean);
      if (dbTypes.length > 0) {
        query = query.in("property_type", dbTypes);
      }
    }

    // Sort
    if (filters.sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (filters.sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else if (filters.sort === "most_popular") {
      query = query.order("view_count", { ascending: false });
    } else {
      // Default: most recent
      query = query.order("listed_date", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("[searchProperties] Supabase error:", error.message);
      return { data: [], error: error.message };
    }

    // Map DB rows to SearchProperty shape
    const properties: SearchProperty[] = (data ?? []).map((row) => {
      // Extract lat/lng from PostGIS geography point
      // coordinates may come as GeoJSON or null
      let lat = 51.5074;
      let lng = -0.1278;
      if (row.coordinates) {
        // Supabase returns geography as GeoJSON: { type: "Point", coordinates: [lng, lat] }
        const geo = typeof row.coordinates === "string"
          ? JSON.parse(row.coordinates)
          : row.coordinates;
        if (geo?.coordinates) {
          lng = geo.coordinates[0];
          lat = geo.coordinates[1];
        }
      }

      return {
        id: row.listing_id,
        slug: row.slug ?? row.listing_id,
        image: row.thumbnail_url ?? null,
        price: Number(row.price),
        address: row.address_line1,
        city: row.city,
        postcode: row.postcode,
        beds: row.bedrooms,
        baths: Number(row.bathrooms),
        sqft: row.square_footage ?? 0,
        type: PROPERTY_TYPE_REVERSE[row.property_type] ?? row.property_type,
        listing_type: row.listing_type as "sale" | "rent",
        lat,
        lng,
        epc_rating: row.epc_rating ?? null,
        tenure: row.tenure ?? null,
        last_sold_date: row.last_sold_date ?? null,
      };
    });

    return { data: properties, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[searchProperties] Unexpected error:", message);
    return { data: filterMockProperties(filters), error: message };
  }
}
