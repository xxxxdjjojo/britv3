/**
 * Landlord portfolio property service.
 *
 * Creating a portfolio property is a TWO-row operation against the live schema:
 *   1. a `properties` row holds the physical address + type/bed/bath
 *      (real columns: address_line1/address_line2, title + description NOT NULL)
 *   2. a `listings` row with `listing_type = 'rent'` makes it appear in the
 *      landlord portfolio (the get_landlord_portfolio_properties RPC filters on
 *      user_id + listing_type='rent'). `price` is NOT NULL on listings.
 *
 * The previous implementation inserted property columns straight into `listings`
 * with an invalid `listing_type` and no `property_id`, so it could never succeed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Property types a landlord can pick for a rental. Every value is a member of
 * the live Postgres `property_type` enum
 * (detached, semi_detached, terraced, flat, bungalow, studio, maisonette, …).
 */
export const LANDLORD_PROPERTY_TYPES = [
  "flat",
  "terraced",
  "semi_detached",
  "detached",
  "bungalow",
  "studio",
  "maisonette",
] as const;

export type LandlordPropertyType = (typeof LANDLORD_PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<LandlordPropertyType, string> = {
  flat: "Flat / Apartment",
  terraced: "Terraced house",
  semi_detached: "Semi-detached house",
  detached: "Detached house",
  bungalow: "Bungalow",
  studio: "Studio",
  maisonette: "Maisonette",
};

export type CreatePortfolioPropertyInput = Readonly<{
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  postcode: string;
  property_type: LandlordPropertyType;
  bedrooms: number;
  bathrooms: number;
  /** Monthly rent in GBP. Optional — defaults the NOT NULL listing price to 0. */
  monthly_rent?: number | null;
}>;

export type CreatePortfolioPropertyResult = Readonly<{
  propertyId: string;
  listingId: string;
}>;

/**
 * Create a property + rental listing for the landlord's portfolio.
 * Throws with a descriptive message if either insert fails.
 */
export async function createPortfolioProperty(
  supabase: SupabaseClient,
  userId: string,
  input: CreatePortfolioPropertyInput,
): Promise<CreatePortfolioPropertyResult> {
  const addressLine1 = input.address_line_1.trim();
  const title = [addressLine1, input.city.trim()].filter(Boolean).join(", ");

  // 1. Insert the physical property (real column names; title + description NOT NULL).
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      address_line1: addressLine1,
      address_line2: input.address_line_2?.trim() || null,
      city: input.city.trim(),
      postcode: input.postcode.trim().toUpperCase(),
      property_type: input.property_type,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      title,
      description: `${title} — managed via the TrueDeed landlord portfolio.`,
      is_hmo: false,
    })
    .select("id")
    .single();

  if (propertyError || !property) {
    throw new Error(propertyError?.message ?? "Failed to create property");
  }

  // 2. Insert the rental listing that links the property to this landlord.
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      property_id: property.id,
      user_id: userId,
      listing_type: "rent",
      price: input.monthly_rent ?? 0,
      // Must be one of weekly|monthly|yearly (listings_rent_frequency_check) and
      // non-null for rent listings (valid_rent_freq).
      rent_frequency: "monthly",
      status: "draft",
    })
    .select("id")
    .single();

  if (listingError || !listing) {
    throw new Error(listingError?.message ?? "Failed to create listing");
  }

  return { propertyId: property.id as string, listingId: listing.id as string };
}
