/**
 * Nearby map listings service.
 * Returns property listings near a given property for rendering price-flag pins
 * on the detail-page map. Server-side only — the caller passes the Supabase
 * server client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingType } from "@/types/property";
import { parseCoordinates } from "./property-detail-service";

export type NearbyMapListing = Readonly<{
  id: string; // listing_id
  slug: string | null;
  priceLabel: string; // e.g. "£450,000" or "£1,800 pcm"
  lat: number;
  lng: number;
}>;

// price is stored in POUNDS in search_listings (NUMERIC(12,2), e.g. 450000.00)
function formatPriceLabel(price: number, listingType: ListingType): string {
  const formatted = `£${price.toLocaleString("en-GB")}`;
  return listingType === "rent" ? `${formatted} pcm` : formatted;
}

export async function getNearbyMapListings(
  params: Readonly<{
    supabase: SupabaseClient;
    propertyId: string;
    postcodeDistrict: string; // e.g. "TW7"
    listingType: ListingType;
    price: number;
  }>,
): Promise<NearbyMapListing[]> {
  const { supabase, propertyId, postcodeDistrict, listingType, price } = params;

  const { data, error } = await supabase
    .from("search_listings")
    .select("listing_id, slug, price, coordinates")
    .eq("listing_type", listingType)
    .like("postcode", `${postcodeDistrict}%`)
    .gte("price", price * 0.8)
    .lte("price", price * 1.2)
    .neq("property_id", propertyId)
    .limit(8);

  if (error || !data) {
    console.warn("[getNearbyMapListings] query failed", {
      propertyId,
      postcodeDistrict,
      listingType,
      error,
    });
    return [];
  }

  const results: NearbyMapListing[] = [];

  for (const row of data as Array<{
    listing_id: string;
    slug: string | null;
    price: number;
    coordinates: unknown;
  }>) {
    const coords = parseCoordinates(row.coordinates);
    if (coords === null) continue;

    results.push({
      id: row.listing_id,
      slug: row.slug,
      priceLabel: formatPriceLabel(row.price, listingType),
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  return results;
}
