/**
 * Listing CRUD service layer.
 * Handles property listing creation, updates, deletion, price history, and analytics.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreatePropertyInput,
  CreateListingInput,
  UpdatePropertyInput,
  UpdateListingInput,
  ListingStatus,
  Property,
  Listing,
  PriceHistory,
  PropertyMedia,
} from "@/types/property";
import { geocodePostcode } from "@/services/geocoding/postcodes-io";

// -- Input type for createListing (combines property + listing fields) --------

type CreateListingFullInput = CreatePropertyInput & Omit<CreateListingInput, "property_id">;

// `status` is accepted on update at runtime (it's in LISTING_FIELDS and drives the
// publish guard below), so the input type must allow callers to set it.
type UpdateListingFullInput = UpdatePropertyInput & UpdateListingInput & { status?: ListingStatus };

type ListingResult = {
  listing: Listing;
  property: Property;
  media?: PropertyMedia[];
};

type ListingAnalytics = {
  view_count: number;
  favorite_count: number;
  enquiry_count: number;
};

// -- Property field keys (to separate property vs listing fields) -------------

const PROPERTY_FIELDS = new Set([
  "address_line1",
  "address_line2",
  "city",
  "county",
  "postcode",
  "coordinates",
  "property_type",
  "bedrooms",
  "bathrooms",
  "reception_rooms",
  "square_footage",
  "title",
  "description",
  "features",
  "epc_rating",
  "epc_score",
  "tenure",
  "lease_remaining_years",
  "council_tax_band",
  "planning_permission_status",
  "year_built",
  "new_build",
]);

const LISTING_FIELDS = new Set([
  "listing_type",
  "price",
  "rent_frequency",
  "price_qualifier",
  "service_charge_annual",
  "ground_rent_annual",
  "available_from",
  "status",
]);

function splitFields(input: Record<string, unknown>) {
  const propertyData: Record<string, unknown> = {};
  const listingData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (PROPERTY_FIELDS.has(key)) {
      propertyData[key] = value;
    } else if (LISTING_FIELDS.has(key)) {
      listingData[key] = value;
    }
  }

  return { propertyData, listingData };
}

// -- CRUD operations ---------------------------------------------------------

/**
 * Create a new property listing.
 * 1. Geocodes the postcode for coordinates
 * 2. Inserts property row
 * 3. Sets coordinates via RPC (PostGIS)
 * 4. Inserts listing row
 */
export async function createListing(
  supabase: SupabaseClient,
  userId: string,
  input: CreateListingFullInput,
): Promise<ListingResult> {
  // Validate rent listings require rent_frequency
  if (input.listing_type === "rent" && !input.rent_frequency) {
    throw new Error("rent_frequency is required for rent listings");
  }

  // Geocode postcode
  const geo = await geocodePostcode(input.postcode);

  // Split into property and listing fields
  const { propertyData, listingData } = splitFields(input as unknown as Record<string, unknown>);

  // Insert property
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert(propertyData)
    .select()
    .single();

  if (propertyError || !property) {
    throw new Error(
      `Failed to create property: ${propertyError?.message ?? "Unknown error"}`,
    );
  }

  // Set PostGIS coordinates via RPC (fire-and-forget)
  if (geo) {
    void supabase
      .rpc("set_property_coordinates", {
        p_property_id: property.id,
        p_lng: geo.longitude,
        p_lat: geo.latitude,
      })
      .then(() => undefined, () => undefined);
  }

  // Insert listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      property_id: property.id,
      user_id: userId,
      ...listingData,
      status: "draft",
    })
    .select()
    .single();

  if (listingError || !listing) {
    throw new Error(
      `Failed to create listing: ${listingError?.message ?? "Unknown error"}`,
    );
  }

  // Fire-and-forget: refresh materialized view
  void supabase
    .rpc("refresh_search_listings")
    .then(() => undefined, () => undefined);

  return {
    listing: listing as Listing,
    property: property as Property,
  };
}

/**
 * Update an existing listing and/or its property.
 * Verifies ownership before updating.
 * Price changes trigger a database trigger for price_history.
 */
export async function updateListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  input: UpdateListingFullInput,
): Promise<ListingResult> {
  // Verify ownership
  const { data: existing, error: ownershipError } = await supabase
    .from("listings")
    .select("*, properties(*)")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (ownershipError || !existing) {
    throw new Error(
      `Listing not found or not owned by user: ${ownershipError?.message ?? "Not found"}`,
    );
  }

  const { propertyData, listingData } = splitFields(input as unknown as Record<string, unknown>);

  // Publish guard: planning permission status must be declared before going live
  if (listingData.status === "active") {
    const effectivePlanningStatus =
      propertyData.planning_permission_status ??
      (existing.properties as Property | null)?.planning_permission_status;

    if (effectivePlanningStatus == null) {
      throw new Error(
        "planning_permission_status is required to publish a listing",
      );
    }
  }

  let updatedProperty = existing.properties as Property;
  let updatedListing = existing as Listing;

  // Update property fields if any
  if (Object.keys(propertyData).length > 0) {
    const { data: propResult, error: propError } = await supabase
      .from("properties")
      .update(propertyData)
      .eq("id", existing.property_id)
      .select()
      .single();

    if (propError) {
      throw new Error(`Failed to update property: ${propError.message}`);
    }
    updatedProperty = propResult as Property;
  }

  // Update listing fields if any
  if (Object.keys(listingData).length > 0) {
    const { data: listResult, error: listError } = await supabase
      .from("listings")
      .update(listingData)
      .eq("id", listingId)
      .select()
      .single();

    if (listError) {
      throw new Error(`Failed to update listing: ${listError.message}`);
    }
    updatedListing = listResult as Listing;
  }

  // Fire-and-forget: refresh materialized view
  void supabase
    .rpc("refresh_search_listings")
    .then(() => undefined, () => undefined);

  return {
    listing: updatedListing,
    property: updatedProperty,
  };
}

/**
 * Get a single listing with property and media data.
 */
export async function getListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<ListingResult | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, properties(*), property_media(*)")
    .eq("id", listingId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    listing: data as unknown as Listing,
    property: data.properties as Property,
    media: (data.property_media ?? []) as PropertyMedia[],
  };
}

/**
 * Get a listing by its slug.
 */
export async function getListingBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<ListingResult | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, properties(*), property_media(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    listing: data as unknown as Listing,
    property: data.properties as Property,
    media: (data.property_media ?? []) as PropertyMedia[],
  };
}

/**
 * Get current user's listings with optional filtering and pagination.
 */
export async function getMyListings(
  supabase: SupabaseClient,
  userId: string,
  params?: { status?: string; page?: number; limit?: number },
): Promise<{ data: ListingResult[]; count: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*, properties(*), property_media(*)", { count: "exact" })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get listings: ${error.message}`);
  }

  const results = (data ?? []).map((row: Record<string, unknown>) => ({
    listing: row as unknown as Listing,
    property: row.properties as Property,
    media: (row.property_media ?? []) as PropertyMedia[],
  }));

  return {
    data: results,
    count: count ?? 0,
  };
}

/**
 * Soft delete a listing by setting deleted_at.
 */
export async function deleteListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<void> {
  // Verify ownership
  const { data: existing, error: ownershipError } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (ownershipError || !existing) {
    throw new Error(
      `Listing not found or not owned by user: ${ownershipError?.message ?? "Not found"}`,
    );
  }

  const { error: deleteError } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", listingId)
    .select()
    .single();

  if (deleteError) {
    throw new Error(`Failed to delete listing: ${deleteError.message}`);
  }

  // Fire-and-forget: refresh materialized view
  void supabase
    .rpc("refresh_search_listings")
    .then(() => undefined, () => undefined);
}

/**
 * Get price history for a listing, ordered by most recent first.
 */
export async function getPriceHistory(
  supabase: SupabaseClient,
  listingId: string,
): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from("price_history")
    .select("*")
    .eq("listing_id", listingId)
    .order("changed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get price history: ${error.message}`);
  }

  return (data ?? []) as PriceHistory[];
}

/**
 * Get analytics counts for a listing.
 */
export async function getListingAnalytics(
  supabase: SupabaseClient,
  listingId: string,
): Promise<ListingAnalytics> {
  const { data, error } = await supabase
    .from("listings")
    .select("view_count, favorite_count, enquiry_count")
    .eq("id", listingId)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to get listing analytics: ${error?.message ?? "Not found"}`,
    );
  }

  return data as ListingAnalytics;
}

/**
 * Increment the view count for a listing via RPC.
 */
export async function incrementViewCount(
  supabase: SupabaseClient,
  listingId: string,
): Promise<void> {
  const { error } = await supabase.rpc("increment_listing_view_count", {
    p_listing_id: listingId,
  });

  if (error) {
    throw new Error(`Failed to increment view count: ${error.message}`);
  }
}
