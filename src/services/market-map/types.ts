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
// Area detail (flat vs house breakdown) — selected-area panel
// ---------------------------------------------------------------------------

/** One price segment (overall / flat / house) in POUNDS. */
export type AreaPriceSegment = {
  /** Median sold price in pounds, or null when there are no sales. */
  median: number | null;
  transaction_count: number;
  confidence: ConfidenceLevel;
  latest_transaction_date: string | null;
};

/**
 * Per-area sold-price breakdown for the selected-area panel.
 * Prices are in POUNDS. Flat = F; House = detached + semi-detached + terraced.
 */
export type AreaPriceDetail = {
  area_id: string;
  geography_level: string;
  date_from: string;
  date_to: string;
  overall: AreaPriceSegment & {
    /** P10 sold price in pounds, or null. */
    p10: number | null;
    /** P90 sold price in pounds, or null. */
    p90: number | null;
  };
  flat: AreaPriceSegment;
  house: AreaPriceSegment;
};

/** Raw segment as returned by the market_map_area_detail RPC (prices in pence). */
export type RawAreaDetailSegment = {
  median_pence: number | null;
  count: number;
  latest_date: string | null;
  p10_pence?: number | null;
  p90_pence?: number | null;
};

/** Raw jsonb payload from the market_map_area_detail RPC. */
export type RawAreaDetail = {
  area_id: string;
  geography_level: string;
  date_from: string;
  date_to: string;
  overall: RawAreaDetailSegment;
  flat: RawAreaDetailSegment;
  house: RawAreaDetailSegment;
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
  /**
   * Optional UI hint for the street / micro-area layer (zoom ≥ 16).
   * When present, the map UI should display this label instead of a generic
   * geography-level label. Value: "micro-area sold-price band".
   * NOT "street valuation" and NOT "£/m²".
   */
  band_label?: "micro-area sold-price band";
};
