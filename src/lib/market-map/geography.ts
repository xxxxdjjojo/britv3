/**
 * Geography level mapping for the market price map.
 *
 * Each level corresponds to a set of ONS/OS boundary polygons that are loaded
 * and rendered at the given zoom range. Within each band, other ONS levels
 * (ward, postcode sector, etc.) are interchangeable depending on boundary
 * availability — this function returns the canonical level the app materialises.
 *
 * No IO, no side effects. Safe to import in any context.
 */

/** The five canonical geography levels supported by the market map. */
export type GeographyLevel =
  | "local_authority"
  | "postcode_district"
  | "msoa"
  | "lsoa"
  | "street";

/**
 * All geography levels ordered coarse → fine.
 * Useful for iterating or deriving display labels.
 */
export const GEOGRAPHY_LEVELS: readonly GeographyLevel[] = [
  "local_authority",
  "postcode_district",
  "msoa",
  "lsoa",
  "street",
];

/**
 * Returns the canonical geography level for a given MapLibre zoom value.
 *
 * Product spec zoom bands:
 *   zoom <  7  → local_authority   (country / region / county / LA — z4–6)
 *   zoom <  10 → postcode_district (city / borough / postcode area or district — z7–9)
 *   zoom <  13 → msoa              (neighbourhood — z10–12)
 *   zoom <  16 → lsoa              (local pockets — z13–15)
 *   zoom ≥  16 → street            (street / micro-area — z16+)
 *
 * Fractional zooms are handled naturally by the numeric comparisons.
 * Zooms below the minimum usable level (< 7) — including negative values — are
 * clamped to `local_authority`.
 *
 * Within each band, other ONS levels (ward, postcode sector) are
 * interchangeable depending on boundary availability — this function returns
 * the canonical level the app materialises.
 */
export function geographyLevelForZoom(zoom: number): GeographyLevel {
  if (zoom < 7) return "local_authority";
  if (zoom < 10) return "postcode_district";
  if (zoom < 13) return "msoa";
  if (zoom < 16) return "lsoa";
  return "street";
}
