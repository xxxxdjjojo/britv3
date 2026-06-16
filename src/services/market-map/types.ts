/**
 * Shared types for the market-map service layer.
 *
 * Prices exposed to callers are in POUNDS (integer). The service layer divides
 * the pence values returned by Postgres by 100 before placing them in these types.
 */

import type { GeographyLevel } from "@/lib/market-map/geography";
import type { ConfidenceLevel } from "@/lib/market-map/confidence";

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** National: colour scale spans full national price range (p5/p95 of all areas).
 *  Local: colour scale recomputed from the visible/requested set only. */
export type MarketMapScaleMode = "national" | "local";

/** All filters driving a market-map request. */
export type MarketMapFilters = {
  geographyLevel: GeographyLevel;
  propertyType: "all" | "detached" | "semi-detached" | "terraced" | "flat";
  fromDate: string;
  toDate: string;
  scaleMode: MarketMapScaleMode;
  /** Optional viewport bounding box [west, south, east, north] in WGS-84 degrees. */
  bbox?: [number, number, number, number];
};

// ---------------------------------------------------------------------------
// Feature properties (all prices in POUNDS)
// ---------------------------------------------------------------------------

/**
 * GeoJSON Feature properties for a market-map choropleth area.
 * Prices are in POUNDS (integer).
 */
export type MarketMapFeatureProperties = {
  area_id: string;
  area_name: string | null;
  geography_level: string;
  /** Median sold price in pounds (integer). */
  median_price: number;
  /** P10 sold price in pounds (integer). */
  p10_price: number;
  /** P90 sold price in pounds (integer). */
  p90_price: number;
  transaction_count: number;
  latest_transaction_date: string | null;
  confidence: ConfidenceLevel;
  /** Choropleth bucket 1–9, or null when confidence is Insufficient. */
  colour_bucket: number | null;
  /** Hex fill colour for choropleth rendering. */
  fill_colour: string;
  scale_mode: MarketMapScaleMode;
  /** ISO date string representing the start of the query window. */
  date_from: string;
  /** ISO date string representing the end of the query window. */
  date_to: string;
  /** Fraction of transactions per property type (e.g. { detached: 120, terraced: 80 }). */
  property_type_mix: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Metadata (included in the FeatureCollection)
// ---------------------------------------------------------------------------

/**
 * Metadata block attached to the FeatureCollection.
 * Task 7's API route passes this through to the client verbatim.
 */
export type MarketMapMetadata = {
  metric: "median_sold_price";
  currency: "GBP";
  /** Floor-area (£/m²) data is not available — always false. */
  sqm_available: false;
  scale_mode: MarketMapScaleMode;
  source: "HM Land Registry Price Paid Data joined to postcode geography";
  /** Minimum transactions required for a non-grey bucket (confidence >= Low). */
  minimum_transactions: 5;
};
