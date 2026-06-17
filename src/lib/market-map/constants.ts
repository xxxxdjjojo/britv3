/**
 * Shared constants for the market-map (median sold price by area) feature.
 *
 * The metric is MEDIAN SOLD PRICE by postcode-district, derived from HM Land
 * Registry Price Paid Data. There is no floor-area data, so nothing here is a
 * "£/m²" figure.
 */

export type Confidence = "High" | "Medium" | "Low" | "Insufficient";

/**
 * Minimum transaction counts for each confidence level.
 * High >= 30, Medium >= 10, Low >= 5, otherwise Insufficient.
 */
export const CONFIDENCE_THRESHOLDS = {
  high: 30,
  medium: 10,
  low: 5,
} as const;

/**
 * Sequential price ramp in the brand green system: light green (lower median)
 * -> deep green (higher median). Anchored on the brand greens
 * (--color-brand-primary-lighter #E8F5EE through --color-brand-primary-dark
 * #003629) so the public heatmap stays on-brand: single-hue, no blue or
 * multi-hue rainbow. Higher price reads as a deeper, richer green.
 */
export const PRICE_RAMP: readonly string[] = [
  "#E8F5EE", // 0 — lowest  (brand-primary-lighter)
  "#C7E6D6",
  "#9FD2BA",
  "#6FB897",
  "#2D7A5F", //            (brand-primary-light)
  "#1B4D3E", //            (brand-primary)
  "#0F3B2E",
  "#003629", // 7 — highest (brand-primary-dark)
];

/** Neutral grey used for areas with insufficient data (no strong colour). */
export const INSUFFICIENT_COLOUR = "#D8D5D1";

/** Default time window for the MVP, in months. */
export const DEFAULT_WINDOW_MONTHS = 36;

/** Land Registry `district` value for the MVP borough. */
export const WANDSWORTH_DISTRICT = "WANDSWORTH";

/** Geography levels. Only postcode_district is implemented for the MVP. */
export const GEOGRAPHY_LEVELS = [
  "postcode_district",
  "postcode_sector",
  "lsoa",
  "hex",
] as const;
export type GeographyLevel = (typeof GEOGRAPHY_LEVELS)[number];

/** Land Registry property-type codes mapped to filter values. */
export const PROPERTY_TYPES = {
  all: null,
  detached: "D",
  "semi-detached": "S",
  terraced: "T",
  flat: "F",
} as const;
export type PropertyTypeFilter = keyof typeof PROPERTY_TYPES;
