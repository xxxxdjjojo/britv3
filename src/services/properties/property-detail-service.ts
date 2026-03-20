/**
 * Property Detail service.
 * Server-side only — all queries use the Supabase server client.
 * Provides all DB queries needed for the property detail page.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// -- Types -------------------------------------------------------------------

export type ListingStatus =
  | "draft"
  | "active"
  | "under_offer"
  | "sold"
  | "let"
  | "withdrawn"
  | "archived";

export type PropertyDetail = {
  listing: {
    id: string;
    slug: string;
    listingType: "sale" | "rent";
    status: ListingStatus;
    price: number;
    rentFrequency: string | null;
    priceQualifier: string | null;
    listedDate: string;
    viewCount: number;
  };
  property: {
    id: string;
    title: string;
    description: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    receptionRooms: number | null;
    squareFootage: number | null;
    features: Record<string, unknown>;
    epcRating: string | null;
    epcScore: number | null;
    tenure: string | null;
    leaseRemainingYears: number | null;
    councilTaxBand: string | null;
    yearBuilt: number | null;
    newBuild: boolean;
    coordinates: { lat: number; lng: number } | null;
  };
  media: {
    id: string;
    mediaType: "image" | "floor_plan" | "epc_document";
    url: string;
    thumbnailUrl: string | null;
    caption: string | null;
    altText: string | null;
    sortOrder: number;
  }[];
  agent: {
    id: string;
    displayName: string;
    agencyName: string;
    contactEmail: string | null;
    contactPhone: string | null;
    logoUrl: string | null;
  } | null;
};

export type PriceHistoryEntry = {
  oldPrice: number;
  newPrice: number;
  changedAt: string;
};

export type SimilarProperty = {
  listingId: string;
  slug: string;
  title: string;
  price: number;
  bedrooms: number;
  city: string;
  thumbnailUrl: string | null;
};

// -- Helpers -----------------------------------------------------------------

/**
 * Parse PostGIS GEOGRAPHY point string into { lat, lng } or null.
 * Supabase returns geography as a GeoJSON object or WKT string.
 */
function parseCoordinates(
  coordinates: unknown,
): { lat: number; lng: number } | null {
  if (!coordinates) return null;

  // GeoJSON object: { type: "Point", coordinates: [lng, lat] }
  if (
    typeof coordinates === "object" &&
    coordinates !== null &&
    "type" in coordinates &&
    (coordinates as Record<string, unknown>).type === "Point" &&
    "coordinates" in coordinates
  ) {
    const coords = (coordinates as Record<string, unknown>)
      .coordinates as number[];
    if (Array.isArray(coords) && coords.length >= 2) {
      return { lat: coords[1], lng: coords[0] };
    }
  }

  return null;
}

// -- Public API --------------------------------------------------------------

/**
 * Get a property and its listing by slug.
 * Returns only active or under_offer listings (so detail pages remain
 * accessible for under-offer properties).
 * Returns null if not found or in an inaccessible status.
 */
export async function getPropertyBySlug(
  slug: string,
): Promise<PropertyDetail | null> {
  const supabase = await createClient();

  // Fetch listing + property in one query
  const { data: listingRow, error: listingError } = await supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      listing_type,
      status,
      price,
      rent_frequency,
      price_qualifier,
      listed_date,
      view_count,
      user_id,
      property_id,
      properties (
        id,
        title,
        description,
        address_line1,
        address_line2,
        city,
        county,
        postcode,
        property_type,
        bedrooms,
        bathrooms,
        reception_rooms,
        square_footage,
        features,
        epc_rating,
        epc_score,
        tenure,
        lease_remaining_years,
        council_tax_band,
        year_built,
        new_build,
        coordinates
      )
    `,
    )
    .eq("slug", slug)
    .in("status", ["active", "under_offer"])
    .single();

  if (listingError || !listingRow) {
    return null;
  }

  const property = listingRow.properties as unknown as Record<string, unknown> | null;
  if (!property) {
    return null;
  }

  // Fetch media for this listing, sorted by sort_order
  const { data: mediaRows } = await supabase
    .from("property_media")
    .select("id, media_type, url, thumbnail_url, caption, alt_text, sort_order")
    .eq("listing_id", listingRow.id)
    .order("sort_order", { ascending: true });

  // Fetch agent profile (agent is the listing's user_id)
  const agentUserId = listingRow.user_id as string;
  let agent: PropertyDetail["agent"] = null;

  if (agentUserId) {
    const { data: agentProfile } = await supabase
      .from("agent_agency_profiles")
      .select(
        "id, agent_id, agency_name, contact_email, contact_phone, logo_url",
      )
      .eq("agent_id", agentUserId)
      .maybeSingle();

    if (agentProfile) {
      // Fetch display_name from profiles
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", agentUserId)
        .maybeSingle();

      agent = {
        id: agentProfile.agent_id as string,
        displayName:
          (profileRow?.display_name as string | null) ??
          (agentProfile.agency_name as string),
        agencyName: agentProfile.agency_name as string,
        contactEmail: (agentProfile.contact_email as string | null) ?? null,
        contactPhone: (agentProfile.contact_phone as string | null) ?? null,
        logoUrl: (agentProfile.logo_url as string | null) ?? null,
      };
    }
  }

  const media: PropertyDetail["media"] = (mediaRows ?? []).map(
    (m: Record<string, unknown>) => ({
      id: m.id as string,
      mediaType: m.media_type as "image" | "floor_plan" | "epc_document",
      url: m.url as string,
      thumbnailUrl: (m.thumbnail_url as string | null) ?? null,
      caption: (m.caption as string | null) ?? null,
      altText: (m.alt_text as string | null) ?? null,
      sortOrder: (m.sort_order as number) ?? 0,
    }),
  );

  return {
    listing: {
      id: listingRow.id as string,
      slug: listingRow.slug as string,
      listingType: listingRow.listing_type as "sale" | "rent",
      status: listingRow.status as ListingStatus,
      price: listingRow.price as number,
      rentFrequency: (listingRow.rent_frequency as string | null) ?? null,
      priceQualifier: (listingRow.price_qualifier as string | null) ?? null,
      listedDate: listingRow.listed_date as string,
      viewCount: (listingRow.view_count as number) ?? 0,
    },
    property: {
      id: property.id as string,
      title: (property.title as string) ?? "",
      description: (property.description as string) ?? "",
      addressLine1: (property.address_line1 as string) ?? "",
      addressLine2: (property.address_line2 as string | null) ?? null,
      city: (property.city as string) ?? "",
      county: (property.county as string | null) ?? null,
      postcode: (property.postcode as string) ?? "",
      propertyType: (property.property_type as string) ?? "",
      bedrooms: (property.bedrooms as number) ?? 0,
      bathrooms: (property.bathrooms as number) ?? 0,
      receptionRooms: (property.reception_rooms as number | null) ?? null,
      squareFootage: (property.square_footage as number | null) ?? null,
      features:
        (property.features as Record<string, unknown> | null) ?? {},
      epcRating: (property.epc_rating as string | null) ?? null,
      epcScore: (property.epc_score as number | null) ?? null,
      tenure: (property.tenure as string | null) ?? null,
      leaseRemainingYears:
        (property.lease_remaining_years as number | null) ?? null,
      councilTaxBand: (property.council_tax_band as string | null) ?? null,
      yearBuilt: (property.year_built as number | null) ?? null,
      newBuild: (property.new_build as boolean) ?? false,
      coordinates: parseCoordinates(property.coordinates),
    },
    media,
    agent,
  };
}

/**
 * Get price history for a listing, ordered by most recent change first.
 */
export async function getPriceHistory(
  listingId: string,
): Promise<PriceHistoryEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("price_history")
    .select("old_price, new_price, changed_at")
    .eq("listing_id", listingId)
    .order("changed_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    oldPrice: row.old_price as number,
    newPrice: row.new_price as number,
    changedAt: row.changed_at as string,
  }));
}

/**
 * Get similar properties: same city + property_type, excluding the current
 * listing, only active listings. Defaults to 6 results.
 */
export async function getSimilarProperties(
  propertyId: string,
  listingId: string,
  limit = 6,
): Promise<SimilarProperty[]> {
  const supabase = await createClient();

  // First, get the city and property_type for the reference property
  const { data: refProperty, error: refError } = await supabase
    .from("properties")
    .select("city, property_type")
    .eq("id", propertyId)
    .maybeSingle();

  if (refError || !refProperty) {
    return [];
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      price,
      properties (
        id,
        title,
        bedrooms,
        city,
        property_type
      ),
      property_media (
        thumbnail_url,
        sort_order,
        media_type
      )
    `,
    )
    .eq("status", "active")
    .neq("id", listingId)
    .limit(limit * 3); // Fetch extra; filter by city + type in JS since nested filters are limited

  if (error || !data) {
    return [];
  }

  const results: SimilarProperty[] = [];

  for (const row of data as Record<string, unknown>[]) {
    const prop = row.properties as Record<string, unknown> | null;
    if (!prop) continue;
    // TODO: Push city + property_type filters to Supabase query level to
    // eliminate JS-side filtering and avoid under-delivering results at scale.
    if (
      (prop.city as string)?.toLowerCase() !==
        (refProperty.city as string)?.toLowerCase() ||
      prop.property_type !== refProperty.property_type
    ) {
      continue;
    }

    // Get the first image thumbnail
    const mediaList = (
      row.property_media as Record<string, unknown>[] | null
    ) ?? [];
    const images = mediaList
      .filter((m) => m.media_type === "image")
      .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0));
    const thumbnailUrl =
      (images[0]?.thumbnail_url as string | null) ?? null;

    results.push({
      listingId: row.id as string,
      slug: row.slug as string,
      title: (prop.title as string) ?? "",
      price: row.price as number,
      bedrooms: (prop.bedrooms as number) ?? 0,
      city: (prop.city as string) ?? "",
      thumbnailUrl,
    });

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Check whether the current authenticated user has saved a listing,
 * and retrieve their note if any.
 *
 * Returns { saved: false, note: null } when the user is not authenticated
 * or has not saved the listing — never throws.
 *
 * Note: saved_properties.listing_id references listings.id.
 */
export async function getSavedStatus(
  listingId: string,
): Promise<{ saved: boolean; note: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { saved: false, note: null };
  }

  const { data } = await supabase
    .from("saved_properties")
    .select("id, note")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (!data) {
    return { saved: false, note: null };
  }

  return {
    saved: true,
    note: (data.note as string | null) ?? null,
  };
}

/**
 * Record a property view.
 * Fire-and-forget: wrapped in a void IIFE, never throws, never awaited by callers.
 *
 * Inserts into property_views using the listing's property_id.
 * view_count on the listings table is intentionally NOT incremented here —
 * it can be recomputed from the property_views table by a scheduled function.
 * (The increment_listing_view_count RPC does not exist in migrations.)
 */
export async function recordPropertyView(
  listingId: string,
  sessionId: string,
): Promise<void> {
  void (async () => {
    try {
      const supabase = await createClient();

      // Get the property_id for this listing
      const { data: listing } = await supabase
        .from("listings")
        .select("property_id")
        .eq("id", listingId)
        .single();

      if (!listing) return;

      // Insert into property_views; created_at defaults to now()
      await supabase.from("property_views").insert({
        property_id: listing.property_id,
        session_id: sessionId,
      });
    } catch {
      // Fire-and-forget — never throw
    }
  })();
}

/**
 * Get a cached property insight from the property_insights table.
 * Returns null if no unexpired insight exists for the given type.
 */
export async function getPropertyInsights(
  propertyId: string,
  insightType: "land_registry" | "ofsted" | "crime" | "broadband" | "roi",
): Promise<unknown | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("property_insights")
    .select("data, expires_at")
    .eq("property_id", propertyId)
    .eq("insight_type", insightType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Return null if the cached insight has expired
  if (data.expires_at && new Date(data.expires_at as string) < new Date()) {
    return null;
  }

  return data.data ?? null;
}

// ---------------------------------------------------------------------------
// getPropertyViewCount
// ---------------------------------------------------------------------------

const DEFAULT_VIEW_WINDOW_MINUTES = 30;

/**
 * Count recent property views within a time window (default 30 min).
 * Degrades gracefully — view count is non-critical.
 */
export async function getPropertyViewCount(
  supabase: SupabaseClient,
  propertyId: string,
  sinceMinutes = DEFAULT_VIEW_WINDOW_MINUTES,
): Promise<number> {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("property_views")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// getSaveState
// ---------------------------------------------------------------------------

/**
 * Return whether the user has saved a listing and any attached notes.
 */
export async function getSaveState(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<{ saved: boolean; notes: string | null }> {
  const { data } = await supabase
    .from("saved_properties")
    .select("notes")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (!data) return { saved: false, notes: null };
  return { saved: true, notes: (data as Record<string, unknown>).notes as string | null };
}

// ---------------------------------------------------------------------------
// getRenovationBenchmarks
// ---------------------------------------------------------------------------

type RenovationBenchmark = Record<string, unknown>;

/**
 * Fetch renovation benchmarks for a UK region.
 */
export async function getRenovationBenchmarks(
  supabase: SupabaseClient,
  region: string,
): Promise<RenovationBenchmark[]> {
  const { data, error } = await supabase
    .from("renovation_type_benchmarks")
    .select("*")
    .eq("region", region)
    .order("renovation_type", { ascending: true });

  if (error) return [];
  return (data ?? []) as unknown as RenovationBenchmark[];
}
