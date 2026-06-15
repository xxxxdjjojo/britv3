/**
 * Registry of boroughs available in the market-map MVP.
 *
 * For the MVP only Wandsworth is wired up. Each entry maps a URL slug to the
 * Land Registry `district` value and the postcode districts (outward codes) we
 * render for it. Scaling to more boroughs is additive — add entries here and a
 * matching boundary GeoJSON.
 */
export interface BoroughArea {
  slug: string;
  label: string;
  /** Land Registry `district` column value. */
  district: string;
  /** Postcode districts (outward codes) rendered for this borough. */
  outwardCodes: string[];
  /** Boundary GeoJSON bundled for this borough. */
  geojsonName: string;
}

export const BOROUGH_AREAS: Record<string, BoroughArea> = {
  wandsworth: {
    slug: "wandsworth",
    label: "Wandsworth",
    district: "WANDSWORTH",
    outwardCodes: ["SW4", "SW8", "SW11", "SW12", "SW15", "SW16", "SW17", "SW18", "SW19"],
    geojsonName: "wandsworth-postcode-districts.geojson",
  },
};

export const DEFAULT_AREA_SLUG = "wandsworth";

export function resolveArea(slug: string | null | undefined): BoroughArea {
  if (!slug) return BOROUGH_AREAS[DEFAULT_AREA_SLUG];
  return BOROUGH_AREAS[slug.toLowerCase()] ?? BOROUGH_AREAS[DEFAULT_AREA_SLUG];
}
