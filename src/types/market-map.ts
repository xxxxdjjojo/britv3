import type {
  Confidence,
  GeographyLevel,
  PropertyTypeFilter,
} from "@/lib/market-map/constants";

/** Counts of transactions by property-type label, e.g. { Flat: 120, Terraced: 40 }. */
export type PropertyTypeMix = Record<string, number>;

export interface MarketMapFeatureProperties {
  area_id: string;
  area_name: string;
  /** Median sold price in GBP (pounds). */
  median_price: number;
  transaction_count: number;
  p10_price: number;
  p90_price: number;
  confidence: Confidence;
  /** Index into the price ramp, or null when data is insufficient. */
  colour_bucket: number | null;
  fill_colour: string;
  latest_transaction_date: string | null;
  date_from: string;
  date_to: string;
  type_mix: PropertyTypeMix;
}

export type MarketMapFeature = {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: MarketMapFeatureProperties;
};

export interface MarketMapMetadata {
  metric: "median_sold_price";
  currency: "GBP";
  scale: "local" | "national";
  source: string;
  sqm_available: false;
  area: string;
  area_label: string;
  geography_level: GeographyLevel;
  property_type: PropertyTypeFilter;
  date_from: string;
  date_to: string;
}

export interface MarketMapFeatureCollection {
  type: "FeatureCollection";
  features: MarketMapFeature[];
  metadata: MarketMapMetadata;
}

export interface AreaSummary {
  area: string;
  area_label: string;
  /** Borough-wide median across all qualifying transactions (GBP). */
  median_price: number | null;
  transaction_count: number;
  confidence: Confidence;
  date_from: string;
  date_to: string;
  /** Sub-areas ranked cheapest → most expensive (sufficient-data areas first). */
  sub_areas: MarketMapFeatureProperties[];
}

export interface RecentTransaction {
  id: string;
  price: number;
  date: string;
  postcode: string | null;
  outward_code: string | null;
  property_type: string;
  street: string | null;
  paon: string | null;
  town: string | null;
}

export interface TrendPoint {
  period: string;
  median_price: number;
  transaction_count: number;
}

export interface MarketMapQuery {
  area: string;
  geography_level: GeographyLevel;
  property_type: PropertyTypeFilter;
  from_date: string;
  to_date: string;
}
