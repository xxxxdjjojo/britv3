/**
 * Local Paper Data Wire — press-pack copy templates (Influence Phase 2, 2.6).
 *
 * PURE and framework-free: every market figure in the generated copy comes
 * verbatim from the inputs — the templates never invent, re-derive or blend
 * numbers. The only fixed numbers are the disclosed methodology constants in
 * the boilerplate (sample thresholds, trailing window, Land Registry lag).
 */

export type PressPackInput = Readonly<{
  areaName: string;
  areaId: string;
  /** Edition period, e.g. "2026-Q2". */
  period: string;
  /** Signed asking-vs-sold gap in percent (positive = asking above sold). */
  gapPct: number;
  medianAsking: number;
  medianSold: number;
  sampleAsking: number;
  sampleSold: number;
  /** Truth-league position (1 = smallest gap = most honest). */
  rank: number;
  totalRanked: number;
}>;

export type PressPack = Readonly<{
  headline: string;
  paragraphs: readonly [string, string, string];
  boilerplate: string;
  attribution: string;
}>;

/** "£312,500" — pounds with thousands commas, no pence. */
export function formatPounds(value: number): string {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

/** "+4.2%" / "−1.3%" / "0.0%" — signed, one decimal place. */
export function formatSignedGapPct(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  if (value > 0) return `+${rounded}%`;
  if (value < 0) return `−${rounded}%`;
  return `${rounded}%`;
}

/** "1,234" — integer count with thousands commas. */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-GB");
}

const ATTRIBUTION = "Data: TrueDeed (truedeed.co.uk/reports/reality-gap)";

const BOILERPLATE =
  "Methodology: sold prices are medians from HM Land Registry Price Paid Data " +
  "over a trailing 12-month window; asking prices are medians of TrueDeed " +
  "listings over the same window. A district is only published when it clears " +
  "the disclosed sample thresholds (at least 20 asking prices and at least 100 " +
  "recorded sales). Land Registry records arrive with a lag of roughly three " +
  "months, so the most recent sales may not yet appear. Asking and sold medians " +
  "describe two different sets of properties, so the gap is indicative rather " +
  "than a like-for-like measure.";

function headlineFor(areaName: string, gapPct: number): string {
  if (gapPct === 0) {
    return `Asking prices in ${areaName} matched what buyers actually paid`;
  }
  const direction = gapPct > 0 ? "above" : "below";
  return `Asking prices in ${areaName} were ${Math.abs(gapPct).toFixed(1)}% ${direction} what buyers actually paid`;
}

function meaningParagraph(areaName: string, gap: string, gapPct: number): string {
  if (gapPct > 0) {
    return (
      `For local sellers, a gap of ${gap} suggests homes in ${areaName} have tended ` +
      "to sell for less than their asking prices over the period. For buyers, it is " +
      "an indication — not a guarantee — of room to negotiate. The comparison is " +
      "between two different sets of properties, so it describes the direction of " +
      "the local market rather than any individual home."
    );
  }
  if (gapPct < 0) {
    return (
      `For local buyers, a gap of ${gap} suggests homes in ${areaName} have tended ` +
      "to sell for more than their asking prices over the period — a sign of " +
      "competitive bidding. For sellers, it is an indication — not a guarantee — " +
      "that realistic pricing has been rewarded. The comparison is between two " +
      "different sets of properties, so it describes the direction of the local " +
      "market rather than any individual home."
    );
  }
  return (
    `A gap of ${gap} suggests asking prices in ${areaName} have, on the whole, ` +
    "tracked what buyers actually paid over the period. The comparison is between " +
    "two different sets of properties, so it describes the direction of the local " +
    "market rather than any individual home."
  );
}

/**
 * Builds one localised press pack. Every number in the headline and
 * paragraphs is a formatted copy of an input field — nothing is invented.
 */
export function buildPressPack(input: PressPackInput): PressPack {
  const {
    areaName,
    period,
    gapPct,
    medianAsking,
    medianSold,
    sampleAsking,
    sampleSold,
    rank,
    totalRanked,
  } = input;

  const gap = formatSignedGapPct(gapPct);

  const p1 =
    `In ${period}, the median asking price in ${areaName} was ` +
    `${formatPounds(medianAsking)}, while the median price buyers actually paid ` +
    `— as recorded by HM Land Registry — was ${formatPounds(medianSold)}: a gap ` +
    `of ${gap}. The figures are based on ${formatCount(sampleAsking)} asking ` +
    `prices and ${formatCount(sampleSold)} recorded sales.`;

  const p2 =
    `${areaName} is ${formatCount(rank)} of ${formatCount(totalRanked)} ` +
    "districts ranked in TrueDeed's Postcode Truth League, which orders " +
    "districts by the size of the gap between asking and sold prices — the " +
    "smaller the gap, the more closely local asking prices have matched what " +
    "buyers actually paid.";

  const p3 = meaningParagraph(areaName, gap, gapPct);

  return {
    headline: headlineFor(areaName, gapPct),
    paragraphs: [p1, p2, p3],
    boilerplate: BOILERPLATE,
    attribution: ATTRIBUTION,
  };
}

/** The whole pack as journalist-ready plain text (copy-paste friendly). */
export function pressPackToPlainText(pack: PressPack): string {
  return [
    pack.headline,
    "",
    ...pack.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    pack.boilerplate,
    "",
    pack.attribution,
  ].join("\n");
}
