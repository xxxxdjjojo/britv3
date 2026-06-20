/**
 * Property Detail service.
 * Server-side only — all queries use the Supabase server client.
 * Provides all DB queries needed for the property detail page.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features";
import { Constants } from "@/types/database.types";

// Statuses for which the property-detail page is viewable. Derived from the
// generated DB `listing_status` enum (minus draft/archived) so the query can
// never reference a value the enum lacks — passing an unknown value makes
// PostgREST reject the whole query with 22P02, which 404s every property page.
// (Regression: "sold_stc" was hard-coded here but never existed in the enum.)
export const DETAIL_VIEWABLE_STATUSES =
  Constants.public.Enums.listing_status.filter(
    (status) => status !== "draft" && status !== "archived",
  );

// -- Types -------------------------------------------------------------------

export type ListingStatus =
  | "draft"
  | "active"
  | "under_offer"
  | "sold"
  | "sold_stc"
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
    serviceChargeAnnual: number | null;
    groundRentAnnual: number | null;
    availableFrom: string | null;
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
    epcPotentialRating: string | null;
    epcPotentialScore: number | null;
    tenure: string | null;
    leaseRemainingYears: number | null;
    councilTaxBand: string | null;
    planningPermissionStatus: string | null;
    yearBuilt: number | null;
    newBuild: boolean;
    isHmo: boolean;
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

// -- Mock data fallback (when search_live_data flag is off) ------------------

type MockSearchProperty = {
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
  /** Optional room-captioned gallery to exercise the by-room grouping path. */
  gallery?: ReadonlyArray<{ url: string; caption: string }>;
};

const MOCK_PROPERTIES: MockSearchProperty[] = [
  { id: "9", slug: "modern-2-bed-flat-clifton-bristol-sale", image: "/images/properties/property-1.jpg", price: 450000, address: "Clifton", city: "Bristol", postcode: "BS8 2AA", beds: 2, baths: 2, sqft: 920, type: "flat", listing_type: "sale", lat: 51.4545, lng: -2.6202, epc_rating: "B", tenure: "leasehold" },
  { id: "10", slug: "4-bed-period-terrace-hackney-london-sale", image: "/images/properties/property-2.jpg", price: 850000, address: "Hackney", city: "London", postcode: "E8 1DY", beds: 4, baths: 1, sqft: 1480, type: "terraced", listing_type: "sale", lat: 51.545, lng: -0.0553, epc_rating: "C", tenure: "freehold" },
  { id: "11", slug: "cotswold-stone-cottage-burford-oxfordshire-sale", image: "/images/properties/property-3.jpg", price: 375000, address: "Burford", city: "Oxfordshire", postcode: "OX18 4QA", beds: 3, baths: 2, sqft: 1120, type: "cottage", listing_type: "sale", lat: 51.8071, lng: -1.6369, epc_rating: "D", tenure: "freehold" },
  { id: "12", slug: "5-bed-family-home-hampstead-london-sale", image: "/images/properties/property-4.jpg", price: 1200000, address: "Hampstead", city: "London", postcode: "NW3 6TR", beds: 5, baths: 3, sqft: 2250, type: "detached", listing_type: "sale", lat: 51.5566, lng: -0.178, epc_rating: "B", tenure: "freehold" },
  { id: "1", slug: "12-kensington-gardens-london-sale", image: "/images/properties/property-1.jpg", price: 485000, address: "12 Kensington Gardens", city: "London", postcode: "W8 4PT", beds: 3, baths: 2, sqft: 1240, type: "terraced", listing_type: "sale", lat: 51.5014, lng: -0.1794, epc_rating: "C", tenure: "freehold", gallery: [
    { url: "/images/properties/property-1.jpg", caption: "Front exterior" },
    { url: "/images/properties/property-2.jpg", caption: "Kitchen / diner" },
    { url: "/images/properties/property-3.jpg", caption: "Living room" },
    { url: "/images/properties/property-4.jpg", caption: "Master bedroom" },
    { url: "/images/properties/property-1.jpg", caption: "Family bathroom" },
    { url: "/images/properties/property-2.jpg", caption: "Rear garden" },
  ] },
  { id: "2", slug: "8-primrose-hill-road-london-sale", image: "/images/properties/property-2.jpg", price: 625000, address: "8 Primrose Hill Road", city: "London", postcode: "NW1 8YS", beds: 4, baths: 2, sqft: 1650, type: "semi_detached", listing_type: "sale", lat: 51.5392, lng: -0.1547, epc_rating: "B", tenure: "leasehold" },
  { id: "3", slug: "45-bermondsey-street-london-rent", image: "/images/properties/property-3.jpg", price: 1850, address: "45 Bermondsey Street", city: "London", postcode: "SE1 3XF", beds: 2, baths: 1, sqft: 820, type: "flat", listing_type: "rent", lat: 51.4998, lng: -0.0821, epc_rating: "D", tenure: "leasehold" },
  { id: "4", slug: "3-highbury-park-london-sale", image: "/images/properties/property-1.jpg", price: 875000, address: "3 Highbury Park", city: "London", postcode: "N5 1QJ", beds: 5, baths: 3, sqft: 2100, type: "detached", listing_type: "sale", lat: 51.5555, lng: -0.0984, epc_rating: "A", tenure: "freehold" },
  { id: "5", slug: "22-canary-wharf-way-london-rent", image: "/images/properties/property-2.jpg", price: 2200, address: "22 Canary Wharf Way", city: "London", postcode: "E14 5AB", beds: 3, baths: 2, sqft: 1380, type: "flat", listing_type: "rent", lat: 51.5054, lng: -0.0235, epc_rating: null, tenure: "leasehold" },
  { id: "6", slug: "7-peckham-rye-lane-london-sale", image: "/images/properties/property-3.jpg", price: 295000, address: "7 Peckham Rye Lane", city: "London", postcode: "SE15 4JU", beds: 2, baths: 1, sqft: 750, type: "terraced", listing_type: "sale", lat: 51.4691, lng: -0.0691, epc_rating: "E", tenure: "freehold" },
  { id: "7", slug: "15-notting-hill-gate-london-commercial", image: "/images/properties/property-1.jpg", price: 1125000, address: "15 Notting Hill Gate", city: "London", postcode: "W11 3LQ", beds: 5, baths: 4, sqft: 2800, type: "detached", listing_type: "sale", lat: 51.5095, lng: -0.1963, epc_rating: "C", tenure: null },
  { id: "8", slug: "31-borough-market-close-london-sale", image: "/images/properties/property-2.jpg", price: 410000, address: "31 Borough Market Close", city: "London", postcode: "SE1 9AF", beds: 2, baths: 1, sqft: 900, type: "flat", listing_type: "sale", lat: 51.5055, lng: -0.091, epc_rating: "F", tenure: "leasehold" },
];

function buildMockMedia(mock: MockSearchProperty): PropertyDetail["media"] {
  const source =
    mock.gallery ??
    (mock.image
      ? [{ url: mock.image, caption: `${mock.address} exterior` }]
      : []);
  return source.map((item, i) => ({
    id: `mock-media-${mock.id}-${i}`,
    mediaType: "image" as const,
    url: item.url,
    thumbnailUrl: item.url,
    caption: item.caption,
    altText: `${item.caption} — ${mock.address}, ${mock.city}`,
    sortOrder: i,
  }));
}

function getMockPropertyBySlug(slug: string): PropertyDetail | null {
  const mock = MOCK_PROPERTIES.find((p) => p.slug === slug);
  if (!mock) return null;

  return {
    listing: {
      id: `mock-listing-${mock.id}`,
      slug: mock.slug,
      listingType: mock.listing_type,
      status: "active",
      price: mock.price,
      rentFrequency: mock.listing_type === "rent" ? "monthly" : null,
      priceQualifier: null,
      listedDate: "2026-01-15",
      viewCount: Math.floor(Math.random() * 500) + 50,
      serviceChargeAnnual: mock.tenure === "leasehold" ? 1800 : null,
      groundRentAnnual: mock.tenure === "leasehold" ? 250 : null,
      availableFrom: mock.listing_type === "rent" ? "2026-02-01" : null,
    },
    property: {
      id: `mock-property-${mock.id}`,
      title: `${mock.beds} Bed ${mock.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} in ${mock.city}`,
      description: `A stunning ${mock.beds}-bedroom ${mock.type.replace(/_/g, " ")} property located at ${mock.address}, ${mock.city} ${mock.postcode}. This property offers ${mock.sqft} sq ft of living space with ${mock.baths} bathroom${mock.baths > 1 ? "s" : ""}. Close to transport links and local amenities.`,
      addressLine1: mock.address,
      addressLine2: null,
      city: mock.city,
      county: null,
      postcode: mock.postcode,
      propertyType: mock.type,
      bedrooms: mock.beds,
      bathrooms: mock.baths,
      receptionRooms: mock.beds > 2 ? 2 : 1,
      squareFootage: mock.sqft,
      features: { items: ["Central heating", "Double glazing", "Garden", "Parking"] },
      epcRating: mock.epc_rating,
      epcScore: mock.epc_rating ? { A: 95, B: 85, C: 72, D: 58, E: 42, F: 28, G: 12 }[mock.epc_rating] ?? null : null,
      epcPotentialRating: null,
      epcPotentialScore: null,
      tenure: mock.tenure,
      leaseRemainingYears: mock.tenure === "leasehold" ? 95 : null,
      councilTaxBand: ["A", "B", "C", "D", "E"][Number(mock.id) % 5] ?? "C",
      planningPermissionStatus: null,
      yearBuilt: 2000 + Number(mock.id),
      newBuild: false,
      isHmo: false,
      coordinates: { lat: mock.lat, lng: mock.lng },
    },
    media: buildMockMedia(mock),
    agent: {
      id: "mock-agent-1",
      displayName: "Sarah Thompson",
      agencyName: "London Premier Estates",
      contactEmail: "sarah@londonpremier.co.uk",
      contactPhone: "+44 20 7946 0958",
      logoUrl: null,
    },
  };
}

// -- Public API --------------------------------------------------------------

/**
 * Get a property and its listing by slug.
 * When `search_live_data` flag is off, returns mock data for known slugs.
 * Returns only active or under_offer listings (so detail pages remain
 * accessible for under-offer properties).
 * Returns null if not found or in an inaccessible status.
 */
export async function getPropertyBySlug(
  slug: string,
): Promise<PropertyDetail | null> {
  // Mock data fallback when search_live_data is off
  if (!isFeatureEnabled("search_live_data")) {
    const mock = getMockPropertyBySlug(slug);
    if (mock) return mock;
  }

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
      service_charge_annual,
      ground_rent_annual,
      available_from,
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
        epc_potential_rating,
        epc_potential_score,
        tenure,
        lease_remaining_years,
        council_tax_band,
        planning_permission_status,
        year_built,
        new_build,
        is_hmo,
        coordinates
      )
    `,
    )
    .eq("slug", slug)
    .in("status", DETAIL_VIEWABLE_STATUSES)
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
      serviceChargeAnnual:
        (listingRow.service_charge_annual as number | null) ?? null,
      groundRentAnnual:
        (listingRow.ground_rent_annual as number | null) ?? null,
      availableFrom: (listingRow.available_from as string | null) ?? null,
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
      epcPotentialRating:
        (property.epc_potential_rating as string | null) ?? null,
      epcPotentialScore:
        (property.epc_potential_score as number | null) ?? null,
      tenure: (property.tenure as string | null) ?? null,
      leaseRemainingYears:
        (property.lease_remaining_years as number | null) ?? null,
      councilTaxBand: (property.council_tax_band as string | null) ?? null,
      planningPermissionStatus:
        (property.planning_permission_status as string | null) ?? null,
      yearBuilt: (property.year_built as number | null) ?? null,
      newBuild: (property.new_build as boolean) ?? false,
      isHmo: (property.is_hmo as boolean) ?? false,
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
