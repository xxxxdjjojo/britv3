/**
 * Composite and feature-specific types for the property detail page.
 * Extends the core property types in property.ts with enriched data shapes.
 */

import type { Property, Listing, PropertyMedia, PriceHistory } from "./property";

// ---------------------------------------------------------------------------
// Core composite
// ---------------------------------------------------------------------------

/** Full data bundle for a single property detail page. */
export type PropertyDetailData = Readonly<{
  listing: Listing;
  property: Property;
  media: PropertyMedia[];
  priceHistory: PriceHistory[];
  agentProfile: AgentProfile | null;
}>;

// ---------------------------------------------------------------------------
// Agent profile
// ---------------------------------------------------------------------------

/** Subset of profile + agent_agency_profiles data shown on a listing. */
export type AgentProfile = Readonly<{
  id: string;
  display_name: string;
  avatar_url: string | null;
  agency_name: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number;
}>;

// ---------------------------------------------------------------------------
// Insights cache
// ---------------------------------------------------------------------------

/** Mirrors the property_insights table row. */
export type PropertyInsight = Readonly<{
  id: string;
  property_id: string;
  insight_type: "land_registry" | "ofsted" | "crime" | "broadband" | "roi";
  data: unknown;
  fetched_at: string;
  expires_at: string | null;
}>;

// ---------------------------------------------------------------------------
// Renovation benchmarks
// ---------------------------------------------------------------------------

/** Mirrors the renovation_type_benchmarks table row. */
export type RenovationBenchmark = Readonly<{
  id: string;
  renovation_type: string;
  region: string;
  cost_low_per_sqm: number | null;
  cost_high_per_sqm: number | null;
  value_uplift_pct_low: number | null;
  value_uplift_pct_high: number | null;
  data_source: string | null;
  last_updated: string;
}>;

// ---------------------------------------------------------------------------
// Similar listings
// ---------------------------------------------------------------------------

/** Lightweight shape used for the "similar properties" carousel. */
export type SimilarListing = Readonly<{
  listing_id: string;
  slug: string | null;
  title: string;
  price: number;
  bedrooms: number;
  property_type: string;
  city: string;
  thumbnail_url: string | null;
}>;
