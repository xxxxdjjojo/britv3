/**
 * Plain-English labels for the market price map.
 *
 * Normal users searching for a home or an area do not understand ONS jargon
 * ("MSOA", "LSOA", "local authority") or raw area codes ("E02000244"). These
 * helpers translate the geography levels and area ids the data layer speaks into
 * human-readable copy for tooltips, search results and detail cards.
 *
 * No IO, no side effects. Safe to import in any context.
 */

import type { GeographyLevel } from "./geography";

/** Human-readable label for each geography level. No ONS jargon. */
export const LEVEL_LABEL: Record<GeographyLevel, string> = {
  local_authority: "Town / borough",
  postcode_district: "Postcode",
  msoa: "Neighbourhood",
  lsoa: "Local area",
  street: "Street",
};

/**
 * Matches an ONS/OS area code such as E02000244 (MSOA), E01001316 (LSOA) or
 * E09000009 (local authority). These are meaningless to end users and must
 * never be shown — humanizeAreaName replaces them with a friendly label.
 */
const ONS_CODE = /^[EWSNK]\d{8}$/;

/** True when `name` is a raw ONS/OS area code rather than a real place name. */
export function isOnsCode(name: string | null | undefined): boolean {
  if (!name) return false;
  return ONS_CODE.test(name.trim());
}

/**
 * Friendly label for a geography level. Accepts any string (the feature/DTO
 * types widen `geography_level` to `string`, and synthetic records use "") and
 * falls back to a neutral "Area" for unknown values.
 */
export function levelLabel(level: string): string {
  return LEVEL_LABEL[level as GeographyLevel] ?? "Area";
}

/**
 * Returns a user-facing name for an area.
 *
 * - Real names pass through ("Harrow", "HA9", "Ealing 001").
 * - Raw ONS codes and empty/missing names fall back to the friendly level label
 *   ("Neighbourhood", "Local area") so a user never sees "E02000244".
 */
export function humanizeAreaName(
  name: string | null | undefined,
  level: string,
): string {
  const trimmed = name?.trim();
  if (trimmed && !isOnsCode(trimmed)) return trimmed;
  return levelLabel(level);
}

/** Deep link to an area's own price-detail page. */
export function areaHref(areaId: string): string {
  return `/search/market-map/${encodeURIComponent(areaId)}`;
}
