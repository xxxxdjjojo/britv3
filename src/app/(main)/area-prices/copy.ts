/**
 * Pure copy helpers for the Area Prices page.
 *
 * The headline price is a MEDIAN over an area (LSOA → postcode district → MSOA →
 * local authority — whichever level first cleared the sales threshold), never a
 * specific street or property. These helpers keep that labelling honest and
 * unit-testable, away from the React component.
 */

import type {
  PostcodeCardSeries,
  PostcodeLocation,
} from "@/services/market-map/postcode-card-service";

const LEVEL_LABELS: Record<string, string> = {
  lsoa: "this neighbourhood",
  postcode_district: "this postcode district",
  msoa: "this area",
  local_authority: "this local authority",
};

/** Human, honest label for the geography level the figure actually came from. */
export function levelLabel(level: string | null | undefined): string {
  if (!level) return "this area";
  return LEVEL_LABELS[level] ?? "this area";
}

/**
 * Subtext for a price band, e.g. "Based on 42 sales in this postcode district
 * over the last 12 months". Returns null for an insufficient band so the UI
 * never implies a sales count it does not have.
 */
export function bandSubtitle(series: PostcodeCardSeries): string | null {
  if (series.insufficient || series.count === 0) return null;
  const sales =
    series.count === 1 ? "1 sale" : `${series.count.toLocaleString("en-GB")} sales`;
  return `Based on ${sales} in ${levelLabel(series.levelUsed)} over the last 12 months`;
}

/** "M1 1AE · Manchester" — postcode plus the best available place name. */
export function locationHeadline(location: PostcodeLocation | null): string {
  if (!location || !location.postcodeDisplay) return "";
  const place = location.ladName ?? location.region ?? null;
  return place ? `${location.postcodeDisplay} · ${place}` : location.postcodeDisplay;
}

export const METHODOLOGY_NOTE =
  "Median sold prices from HM Land Registry Price Paid Data (England & Wales). " +
  "“Houses” combines detached, semi-detached and terraced sales. These figures " +
  "describe the wider area — not a valuation of any specific property.";

/** Sources for the MethodologyFooter under the recent-sales / trend widgets. */
export const PPD_SOURCES: ReadonlyArray<{ label: string; url: string }> = [
  {
    label: "HM Land Registry Price Paid Data (gov.uk)",
    url: "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads",
  },
  {
    label: "ONS National Statistics Postcode Lookup (postcode → area)",
    url: "https://geoportal.statistics.gov.uk/",
  },
];

/** Honest limitations, rendered prominently — never hidden in small print. */
export const PPD_CAVEATS: ReadonlyArray<string> = [
  "Registered sales appear in Price Paid Data roughly 3 months after completion, so the newest sales may not show yet.",
  "Small samples are suppressed: the sector trend only shows with at least 30 sales in the last 12 months.",
  "All figures are medians of actual sold prices for the surrounding area — they are not a valuation of any specific property.",
];
