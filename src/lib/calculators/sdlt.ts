/**
 * SDLT (Stamp Duty Land Tax) calculation logic
 *
 * Calculates stamp duty for residential property purchases in England
 * and Northern Ireland using April 2025 HMRC rates.
 *
 * Supports three buyer types:
 * - standard: Standard residential rates
 * - first_time: First-time buyer relief (falls back to standard if price > 500K)
 * - additional: Additional property surcharge (+5% on all bands)
 */

import type { BuyerType, SdltBandBreakdown, SdltResult } from "@/types/calculators";
import {
  SDLT_STANDARD,
  SDLT_FIRST_TIME_BUYER,
  SDLT_ADDITIONAL_PROPERTY_SURCHARGE,
  SDLT_FTB_PRICE_CAP,
} from "./sdlt-rates";
import type { SdltBand } from "@/types/calculators";

/**
 * Calculate SDLT tax for the given bands with optional surcharge.
 *
 * Each band defines a threshold (upper limit) and rate.
 * Tax is calculated on the portion of the price within each band.
 */
function calculateBands(
  price: number,
  bands: ReadonlyArray<SdltBand>,
  surcharge: number,
): SdltBandBreakdown[] {
  const breakdowns: SdltBandBreakdown[] = [];
  let remaining = price;
  let previousThreshold = 0;

  for (const band of bands) {
    if (remaining <= 0) break;

    const bandWidth = band.threshold - previousThreshold;
    const taxableInBand = Math.min(remaining, bandWidth);
    const effectiveRate = band.rate + surcharge;
    const tax = Math.round(taxableInBand * effectiveRate * 100) / 100;

    breakdowns.push({
      from: previousThreshold,
      to: previousThreshold + taxableInBand,
      rate: effectiveRate,
      tax,
    });

    remaining -= taxableInBand;
    previousThreshold = band.threshold;
  }

  return breakdowns;
}

/**
 * Calculate Stamp Duty Land Tax for a residential property purchase.
 *
 * @param price - Property price in GBP
 * @param buyerType - Type of buyer (standard, first_time, additional)
 * @returns SDLT result with total tax, effective rate, and per-band breakdown
 */
export function calculateSdlt(price: number, buyerType: BuyerType): SdltResult {
  if (price <= 0) {
    return { totalTax: 0, effectiveRate: 0, bands: [] };
  }

  let bands: ReadonlyArray<SdltBand>;
  let surcharge = 0;

  switch (buyerType) {
    case "first_time":
      // First-time buyer relief only applies if price <= FTB price cap
      bands = price <= SDLT_FTB_PRICE_CAP ? SDLT_FIRST_TIME_BUYER : SDLT_STANDARD;
      break;
    case "additional":
      bands = SDLT_STANDARD;
      surcharge = SDLT_ADDITIONAL_PROPERTY_SURCHARGE;
      break;
    case "standard":
    default:
      bands = SDLT_STANDARD;
      break;
  }

  const bandBreakdowns = calculateBands(price, bands, surcharge);
  const totalTax = Math.round(
    bandBreakdowns.reduce((sum, b) => sum + b.tax, 0),
  );
  const effectiveRate = totalTax / price;

  return {
    totalTax,
    effectiveRate,
    bands: bandBreakdowns,
  };
}
