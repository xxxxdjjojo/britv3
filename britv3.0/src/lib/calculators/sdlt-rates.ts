/**
 * SDLT (Stamp Duty Land Tax) rate band configuration
 *
 * Rates effective from 1 April 2025 (England and Northern Ireland).
 * Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
 * Last updated: April 2025
 *
 * IMPORTANT: These rates reverted from temporary COVID/cost-of-living thresholds.
 * The additional property surcharge increased from 3% to 5% on 31 October 2024.
 */

import type { SdltBand } from "@/types/calculators";

/** Standard residential SDLT bands (April 2025) */
export const SDLT_STANDARD: ReadonlyArray<SdltBand> = [
  { threshold: 125_000, rate: 0 },
  { threshold: 250_000, rate: 0.02 },
  { threshold: 925_000, rate: 0.05 },
  { threshold: 1_500_000, rate: 0.10 },
  { threshold: Infinity, rate: 0.12 },
];

/** First-time buyer SDLT bands (April 2025) */
export const SDLT_FIRST_TIME_BUYER: ReadonlyArray<SdltBand> = [
  { threshold: 300_000, rate: 0 },
  { threshold: 500_000, rate: 0.05 },
];

/** Additional property surcharge rate (5% from 31 October 2024) */
export const SDLT_ADDITIONAL_PROPERTY_SURCHARGE = 0.05;

/** First-time buyer price cap -- above this, standard rates apply */
export const SDLT_FTB_PRICE_CAP = 500_000;
