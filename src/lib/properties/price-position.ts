/**
 * Price position — pure value-rating logic. Compares a listing's price against
 * the area median (from the market_map_postcode_card precompute) and grades it.
 * Deterministic and transparent: the rating is a banding of the percentage
 * delta, with documented thresholds.
 */

export type ValueRating = "good_value" | "fair" | "above_market";

export type PricePositionResult = {
  thisPrice: number;
  areaMedian: number;
  /** (thisPrice − areaMedian) / areaMedian. Negative = below the area median. */
  deltaPct: number;
  rating: ValueRating;
};

/** At or more than 5% below the area median reads as good value. */
export const VALUE_GOOD_THRESHOLD = -0.05;
/** At or more than 10% above the area median reads as above market. */
export const VALUE_ABOVE_THRESHOLD = 0.1;

export function assessValuePosition(
  thisPrice: number,
  areaMedian: number,
): PricePositionResult | null {
  if (!(thisPrice > 0) || !(areaMedian > 0)) return null;

  const deltaPct = (thisPrice - areaMedian) / areaMedian;
  const rating: ValueRating =
    deltaPct <= VALUE_GOOD_THRESHOLD
      ? "good_value"
      : deltaPct >= VALUE_ABOVE_THRESHOLD
        ? "above_market"
        : "fair";

  return { thisPrice, areaMedian, deltaPct, rating };
}

export function valueRatingLabel(rating: ValueRating): string {
  switch (rating) {
    case "good_value":
      return "Good value";
    case "above_market":
      return "Above market";
    case "fair":
    default:
      return "Fair price";
  }
}

/** Which postcode-card band (flat vs house) to compare a property type against. */
export function bandForPropertyType(propertyType: string): "flat" | "house" {
  const flatLike = ["flat", "studio", "maisonette", "penthouse"];
  return flatLike.includes(propertyType) ? "flat" : "house";
}
