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
 * Sequential price ramp: green (lower median) -> yellow/orange -> red (higher
 * median). This is a functional data-visualisation scale (semantic price
 * encoding), distinct from the brand palette. Based on a ColorBrewer
 * RdYlGn ramp, reversed so green = low and red = high.
 */
export const PRICE_RAMP: readonly string[] = [
  "#1A9850", // 0 — lowest
  "#66BD63",
  "#A6D96A",
  "#D9EF8B",
  "#FEE08B",
  "#FDAE61",
  "#F46D43",
  "#D73027", // 7 — highest
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
