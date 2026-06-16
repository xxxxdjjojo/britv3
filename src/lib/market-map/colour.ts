import {
  PRICE_RAMP,
  INSUFFICIENT_COLOUR,
} from "./constants";
import { hasSufficientData } from "./confidence";
import { quantile } from "./stats";

export interface ColourInput {
  /** Median sold price in GBP. */
  medianPrice: number;
  transactionCount: number;
}

export interface AreaColour {
  /** Index into PRICE_RAMP, or null when data is insufficient. */
  colourBucket: number | null;
  fillColour: string;
}

const MIDDLE_BUCKET = Math.floor((PRICE_RAMP.length - 1) / 2);

/**
 * Robust local colour scale for a set of areas.
 *
 * Property prices are heavily skewed, so we work in log space and clamp the
 * domain to the 5th–95th percentile of area medians. This stops a single
 * very-high (or very-low) area from washing out the rest of the map. Areas with
 * insufficient data get a neutral grey and no bucket.
 *
 * Returns one AreaColour per input area, in the same order.
 */
export function assignColours(areas: readonly ColourInput[]): AreaColour[] {
  const logs = areas
    .filter((a) => hasSufficientData(a.transactionCount) && a.medianPrice > 0)
    .map((a) => Math.log10(a.medianPrice));

  const lo = quantile(logs, 0.05);
  const hi = quantile(logs, 0.95);

  return areas.map((area) => {
    if (!hasSufficientData(area.transactionCount) || area.medianPrice <= 0) {
      return { colourBucket: null, fillColour: INSUFFICIENT_COLOUR };
    }
    const bucket = bucketForLog(Math.log10(area.medianPrice), lo, hi);
    return { colourBucket: bucket, fillColour: PRICE_RAMP[bucket] };
  });
}

/**
 * Map a log-median into a ramp bucket given the clamped [lo, hi] log domain.
 * When the domain is degenerate (single area, or all-equal), returns the
 * middle bucket.
 */
export function bucketForLog(logMedian: number, lo: number, hi: number): number {
  if (!(hi > lo)) return MIDDLE_BUCKET;
  const t = Math.min(1, Math.max(0, (logMedian - lo) / (hi - lo)));
  return Math.round(t * (PRICE_RAMP.length - 1));
}
