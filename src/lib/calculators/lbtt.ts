/**
 * LBTT (Land and Buildings Transaction Tax) calculation logic
 *
 * Calculates land tax for residential property purchases in Scotland
 * using current Revenue Scotland rates.
 *
 * Supports first-time buyer relief (higher nil-rate threshold).
 */

import type { SdltBandBreakdown, SdltResult } from "@/types/calculators";

const LBTT_STANDARD = [
  { threshold: 145000, rate: 0 },
  { threshold: 250000, rate: 0.02 },
  { threshold: 325000, rate: 0.05 },
  { threshold: 750000, rate: 0.1 },
  { threshold: Infinity, rate: 0.12 },
];

const LBTT_FIRST_TIME = [
  { threshold: 175000, rate: 0 },
  { threshold: 250000, rate: 0.02 },
  { threshold: 325000, rate: 0.05 },
  { threshold: 750000, rate: 0.1 },
  { threshold: Infinity, rate: 0.12 },
];

/**
 * Calculate LBTT for a residential property purchase in Scotland.
 *
 * @param price - Property price in GBP
 * @param firstTime - Whether the buyer is a first-time buyer
 * @returns Result with total tax, effective rate, and per-band breakdown
 */
export function calculateLbtt(price: number, firstTime: boolean): SdltResult {
  if (price <= 0) {
    return { totalTax: 0, effectiveRate: 0, bands: [] };
  }

  const rateBands = firstTime ? LBTT_FIRST_TIME : LBTT_STANDARD;
  const breakdowns: SdltBandBreakdown[] = [];
  let remaining = price;
  let previousThreshold = 0;

  for (const band of rateBands) {
    if (remaining <= 0) break;

    const bandWidth = band.threshold === Infinity
      ? remaining
      : band.threshold - previousThreshold;
    const taxableInBand = Math.min(remaining, bandWidth);
    const tax = Math.round(taxableInBand * band.rate * 100) / 100;

    breakdowns.push({
      from: previousThreshold,
      to: previousThreshold + taxableInBand,
      rate: band.rate,
      tax,
    });

    remaining -= taxableInBand;
    previousThreshold = band.threshold === Infinity
      ? previousThreshold + taxableInBand
      : band.threshold;
  }

  const totalTax = Math.round(
    breakdowns.reduce((sum, b) => sum + b.tax, 0),
  );
  const effectiveRate = totalTax / price;

  return { totalTax, effectiveRate, bands: breakdowns };
}
