/**
 * Shared types for the Top Properties feature. Kept free of server-only
 * imports so both server services and client components can consume them.
 */

import type { ConfidenceLevel } from "@/lib/market-map/confidence";

/** How a category ranks its candidates. */
export type TopListKind =
  | "value" // asking price vs local sold-price benchmark (valuation-led)
  | "ppsf" // best price per square foot
  | "interest" // views + saves + enquiries blend
  | "saved" // most saved
  | "newest" // most recently listed
  | "largest" // biggest floor area
  | "expensive" // highest asking price
  | "price_drop" // largest listing-price reduction
  | "city"; // blended score within one city

export type TopListCategory = {
  slug: string;
  kind: TopListKind;
  /** Unique H1 for the list page. */
  title: string;
  /** Short label for cards and navigation. */
  shortTitle: string;
  /** <title> tag (brand suffix appended at the page level). */
  metaTitle: string;
  metaDescription: string;
  /** Unique intro paragraph rendered under the H1. */
  intro: string;
  /** Visible ranking-methodology copy — states exactly what is counted. */
  methodology: string;
  /** Accessible label prefix for the ranking-reason badge. */
  badgeLabel: string;
  /** Below this many real items the page is noindexed + left out of the sitemap. */
  minItemsToIndex: number;
  /** Lower-cased city filter for location lists, null for national lists. */
  city: string | null;
};

/** Local sold-price benchmark attached to value-ranked items. */
export type TopListBenchmark = {
  /** Area median sold price in pounds. */
  median: number;
  /** (askingPrice − median) / median. Negative = below the benchmark. */
  deltaPct: number;
  confidence: ConfidenceLevel;
  areaName: string | null;
};

/**
 * One eligible listing, as ranked candidates flow through scoring. All fields
 * come from real listing data — nothing here may be fabricated or defaulted
 * to a fake value.
 */
export type TopListCandidate = {
  listingId: string;
  listingSlug: string;
  title: string;
  /** Asking price in pounds. */
  price: number;
  listingType: "sale" | "rent";
  city: string;
  postcode: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  listedDate: string | null;
  viewCount: number;
  favoriteCount: number;
  enquiryCount: number;
  /** Largest price reduction on this listing, if any. */
  priceDrop: { oldPrice: number; newPrice: number } | null;
  benchmark: TopListBenchmark | null;
};

/** A ranked item ready for rendering and structured data. */
export type TopListItem = TopListCandidate & {
  rank: number;
  score: number;
  /** Human-readable ranking reason shown on the badge (real data only). */
  reason: string;
};

export type TopListResult = {
  category: TopListCategory;
  items: TopListItem[];
  itemCount: number;
  /** True only when the list has at least `minItemsToIndex` real items. */
  isIndexable: boolean;
  /** ISO timestamp of when this ranking was generated. */
  generatedAt: string;
};
