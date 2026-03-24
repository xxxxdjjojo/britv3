/**
 * LTT (Land Transaction Tax) calculation logic
 *
 * Calculates land tax for residential property purchases in Wales
 * using current Welsh Revenue Authority rates.
 *
 * Note: Wales LTT does not have first-time buyer relief.
 */

import type { SdltBandBreakdown, SdltResult } from "@/types/calculators";

const LTT_BANDS = [
  { threshold: 225000, rate: 0 },
  { threshold: 400000, rate: 0.06 },
  { threshold: 750000, rate: 0.075 },
  { threshold: 1500000, rate: 0.1 },
  { threshold: Infinity, rate: 0.12 },
];

/**
 * Calculate LTT for a residential property purchase in Wales.
 *
 * @param price - Property price in GBP
 * @returns Result with total tax, effective rate, and per-band breakdown
 */
export function calculateLtt(price: number): SdltResult {
  if (price <= 0) {
    return { totalTax: 0, effectiveRate: 0, bands: [] };
  }

  const breakdowns: SdltBandBreakdown[] = [];
  let remaining = price;
  let previousThreshold = 0;

  for (const band of LTT_BANDS) {
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
