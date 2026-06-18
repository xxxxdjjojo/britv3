/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use server";

import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchProperty = {
  id: string;
  slug: string;
  image: string | null;
  price: number;
  address: string;
  city: string;
  postcode: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  listing_type: "sale" | "rent";
  lat: number;
  lng: number;
  epc_rating: string | null;
  tenure: string | null;
  /** True only when the listing is genuinely verified. Never fabricated. */
  verified?: boolean;
};

export type SearchFilters = {
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  propertyType?: string[];
  mustHaves?: string[];
  minSqft?: string;
  maxSqft?: string;
  sort?: string;
  q?: string;
};

// ---------------------------------------------------------------------------
// UI property_type label → DB enum value mapping
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_MAP: Record<string, string> = {
  "Detached": "detached",
  "Semi-detached": "semi_detached",
  "Terraced": "terraced",
  "Flat": "flat",
  "Bungalow": "bungalow",
};

const PROPERTY_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_MAP).map(([k, v]) => [v, k]),
);

// ---------------------------------------------------------------------------
// Mock fallback data (used when search_live_data feature flag is off)
// ---------------------------------------------------------------------------

const MOCK_PROPERTIES: SearchProperty[] = [
  { id: "1", slug: "12-kensington-gardens-london-sale", image: "/images/properties/property-1.jpg", price: 485000, address: "12 Kensington Gardens", city: "London", postcode: "W8 4PT", beds: 3, baths: 2, sqft: 1240, type: "Terraced", listing_type: "sale", lat: 51.5014, lng: -0.1794, epc_rating: "C", tenure: "freehold", verified: true },
  { id: "2", slug: "8-primrose-hill-road-london-sale", image: "/images/properties/property-2.jpg", price: 625000, address: "8 Primrose Hill Road", city: "London", postcode: "NW1 8YS", beds: 4, baths: 2, sqft: 1650, type: "Semi-detached", listing_type: "sale", lat: 51.5392, lng: -0.1547, epc_rating: "B", tenure: "leasehold", verified: false },
  { id: "3", slug: "45-bermondsey-street-london-rent", image: "/images/properties/property-3.jpg", price: 1850, address: "45 Bermondsey Street", city: "London", postcode: "SE1 3XF", beds: 2, baths: 1, sqft: 820, type: "Flat", listing_type: "rent", lat: 51.4998, lng: -0.0821, epc_rating: "D", tenure: "leasehold" },
  { id: "4", slug: "3-highbury-park-london-sale", image: "/images/properties/property-1.jpg", price: 875000, address: "3 Highbury Park", city: "London", postcode: "N5 1QJ", beds: 5, baths: 3, sqft: 2100, type: "Detached", listing_type: "sale", lat: 51.5555, lng: -0.0984, epc_rating: "A", tenure: "freehold" },
  { id: "5", slug: "22-canary-wharf-way-london-rent", image: "/images/properties/property-2.jpg", price: 2200, address: "22 Canary Wharf Way", city: "London", postcode: "E14 5AB", beds: 3, baths: 2, sqft: 1380, type: "Flat", listing_type: "rent", lat: 51.5054, lng: -0.0235, epc_rating: null, tenure: "leasehold" },
  { id: "6", slug: "7-peckham-rye-lane-london-sale", image: "/images/properties/property-3.jpg", price: 295000, address: "7 Peckham Rye Lane", city: "London", postcode: "SE15 4JU", beds: 2, baths: 1, sqft: 750, type: "Terraced", listing_type: "sale", lat: 51.4691, lng: -0.0691, epc_rating: "E", tenure: "freehold" },
  { id: "7", slug: "15-notting-hill-gate-london-commercial", image: "/images/properties/property-1.jpg", price: 1125000, address: "15 Notting Hill Gate", city: "London", postcode: "W11 3LQ", beds: 5, baths: 4, sqft: 2800, type: "Detached", listing_type: "sale", lat: 51.5095, lng: -0.1963, epc_rating: "C", tenure: null },
  { id: "8", slug: "31-borough-market-close-london-sale", image: "/images/properties/property-2.jpg", price: 410000, address: "31 Borough Market Close", city: "London", postcode: "SE1 9AF", beds: 2, baths: 1, sqft: 900, type: "Flat", listing_type: "sale", lat: 51.5055, lng: -0.0910, epc_rating: "F", tenure: "leasehold" },
];

// ---------------------------------------------------------------------------
// Client-side filter for mock data (mirrors the Supabase query logic)
// ---------------------------------------------------------------------------

function filterMockProperties(filters: SearchFilters): SearchProperty[] {
  let results = [...MOCK_PROPERTIES];

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

  // Bedrooms
  if (filters.beds && filters.beds !== "Any") {
    const minBeds = filters.beds === "5+" ? 5 : Number(filters.beds);
    if (!isNaN(minBeds)) {
      results = results.filter((p) => p.beds >= minBeds);
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
  // Feature flag gate — fall back to mock data when disabled
  if (!isFeatureEnabled("search_live_data")) {
    return { data: filterMockProperties(filters), error: null };
  }

  try {
    const supabase = await createClient();

    // Query the search_listings materialized view
    let query = supabase
      .from("search_listings")
      .select("listing_id, property_id, listing_type, price, property_type, bedrooms, bathrooms, city, postcode, coordinates, slug, thumbnail_url, title, address_line1, square_footage, epc_rating, tenure")
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

    // Bedrooms
    if (filters.beds && filters.beds !== "Any") {
      const minBeds = filters.beds === "5+" ? 5 : Number(filters.beds);
      if (!isNaN(minBeds)) query = query.gte("bedrooms", minBeds);
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
      // Fall back to mock data on error
      return { data: filterMockProperties(filters), error: error.message };
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
      };
    });

    return { data: properties, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[searchProperties] Unexpected error:", message);
    return { data: filterMockProperties(filters), error: message };
  }
}
