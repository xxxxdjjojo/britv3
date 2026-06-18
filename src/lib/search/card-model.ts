/**
 * Pure listing -> card view-model mapper for the Stitch horizontal property
 * card. Keeping the fallback logic here (not in JSX) makes the honesty rules
 * testable: null price -> "Price on application", null image -> placeholder,
 * null/zero sqft -> omitted, missing slug -> non-link, verified only when true.
 */

import type { SearchProperty } from "@/app/(main)/search/actions";

export type PropertyCardModel = {
  id: string;
  href: string | null;
  title: string;
  priceLabel: string;
  locationLabel: string;
  beds: number;
  baths: number;
  sqftLabel: string | null;
  image: string | null;
  hasImage: boolean;
  isVerified: boolean;
  postcode: string;
};

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  if (!price || price <= 0) return "Price on application";
  const formatted = `£${price.toLocaleString("en-GB")}`;
  return listingType === "rent" ? `${formatted}/mo` : formatted;
}

export function toCardModel(property: SearchProperty): PropertyCardModel {
  const sqft = property.sqft;
  const hasSqft = typeof sqft === "number" && sqft > 0;

  return {
    id: property.id,
    href: property.slug ? `/properties/${property.slug}` : null,
    title: property.address,
    priceLabel: formatPrice(property.price, property.listing_type),
    locationLabel: `${property.city}, ${property.postcode}`,
    beds: property.beds,
    baths: property.baths,
    sqftLabel: hasSqft ? `${sqft.toLocaleString("en-GB")} sqft` : null,
    image: property.image,
    hasImage: Boolean(property.image),
    isVerified: property.verified === true,
    postcode: property.postcode,
  };
}
