/**
 * Pure listing -> card view-model mapper for the Stitch horizontal property
 * card. Keeping the fallback logic here (not in JSX) makes the honesty rules
 * testable: null price -> "Price on application", null image -> placeholder,
 * null/zero sqft -> omitted, missing slug -> non-link, verified only when true.
 */

import type { SearchProperty } from "@/app/(main)/search/actions";
import {
  formatMonthlyRent,
  formatWeeklyRent,
  furnishingLabel as getFurnishingLabel,
} from "@/lib/properties/rental-format";
import { perWeek, perRoom } from "@/lib/properties/rental-cost";

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
  // --- Rent-specific fields (null for sale listings) ---
  isRent: boolean;
  perWeekLabel: string | null;
  perRoomLabel: string | null;
  isLetAgreed: boolean;
  furnishingLabel: string | null;
};

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  if (!price || price <= 0) return "Price on application";
  if (listingType === "rent") return formatMonthlyRent(price);
  return `£${price.toLocaleString("en-GB")}`;
}

export function toCardModel(property: SearchProperty): PropertyCardModel {
  const sqft = property.sqft;
  const hasSqft = typeof sqft === "number" && sqft > 0;

  // DB columns can be null even though the type says string — never render the
  // literal "null"/"undefined".
  const city = property.city ?? "";
  const postcode = property.postcode ?? "";
  const address = property.address ?? "";

  const isRent = property.listing_type === "rent";

  // Per-week label: only for rent with a derivable weekly figure.
  const perWeekLabel: string | null = isRent
    ? (formatWeeklyRent(perWeek(property.price)) || null)
    : null;

  // Per-room label: only for rent with at least 1 bedroom.
  const roomAmount = isRent ? perRoom(property.price, property.beds) : null;
  const perRoomLabel: string | null =
    roomAmount !== null
      ? `£${roomAmount.toLocaleString("en-GB")} pcm / room`
      : null;

  // Furnishing: only for rent, and only when the label is non-empty.
  const rawFurnishingLabel = isRent ? getFurnishingLabel(property.furnishing) : "";
  const furnishingLabel: string | null = rawFurnishingLabel || null;

  return {
    id: property.id,
    href: property.slug ? `/properties/${property.slug}` : null,
    title: address || "Property",
    priceLabel: formatPrice(property.price, property.listing_type),
    locationLabel:
      [city, postcode].filter(Boolean).join(", ") || "Location unavailable",
    beds: property.beds,
    baths: property.baths,
    sqftLabel: hasSqft ? `${sqft.toLocaleString("en-GB")} sqft` : null,
    image: property.image,
    hasImage: Boolean(property.image),
    isVerified: property.verified === true,
    postcode,
    isRent,
    perWeekLabel,
    perRoomLabel,
    isLetAgreed: property.let_agreed === true,
    furnishingLabel,
  };
}
