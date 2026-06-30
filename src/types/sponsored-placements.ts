/**
 * sponsored-placements.ts
 *
 * Domain types for the Featured Trader / Sponsored Placement advertising system.
 * Mirrors the `placement_products`, `sponsored_placements`, and `placement_events`
 * tables (migration 20260630120000).
 */

import type { ServiceCategory } from "@/types/marketplace";

export type PlacementType =
  | "town_boost"
  | "postcode_boost"
  | "property_detail_boost"
  | "category_leader";

export type PlacementProductStatus = "draft" | "active" | "archived";

export type PlacementStatus =
  | "pending_review"
  | "active"
  | "paused"
  | "cancelled"
  | "rejected"
  | "expired";

export type PlacementEventType =
  | "impression"
  | "click"
  | "profile_view"
  | "enquiry_started"
  | "enquiry_submitted";

export type PlacementZone =
  | "property_sidebar"
  | "property_financial"
  | "property_bottom"
  | "search_grid"
  | "area_page"
  | "home";

export const PLACEMENT_TYPE_LABELS: Record<PlacementType, string> = {
  town_boost: "Town Boost",
  postcode_boost: "Postcode Boost",
  property_detail_boost: "Property Detail Boost",
  category_leader: "Category Leader",
};

export type PlacementProduct = {
  id: string;
  name: string;
  placement_type: PlacementType;
  category: ServiceCategory | null;
  region_scope: string | null;
  town: string | null;
  postcode_district: string | null;
  slot_limit: number;
  monthly_price_pence: number;
  launch_discount_pct: number;
  launch_discount_months: number;
  estimated_monthly_views: number;
  stripe_price_id: string | null;
  status: PlacementProductStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SponsoredPlacement = {
  id: string;
  provider_id: string;
  product_id: string | null;
  placement_type: PlacementType;
  category: ServiceCategory | null;
  region_scope: string | null;
  town: string | null;
  postcode_district: string | null;
  status: PlacementStatus;
  monthly_price_pence: number;
  budget_cap_pence: number | null;
  spend_pence: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  starts_at: string;
  ends_at: string | null;
  current_period_end: string | null;
  rejection_reason: string | null;
  admin_featured: boolean;
  priority_override: number | null;
  impressions_count: number;
  clicks_count: number;
  enquiries_count: number;
  created_at: string;
  updated_at: string;
};

/** A row returned by the `featured_experts_for` RPC (pre-ranking candidate). */
export type FeaturedExpertRow = {
  placement_id: string;
  provider_id: string;
  business_name: string;
  slug: string;
  avatar_url: string | null;
  services: ServiceCategory[];
  service_postcodes: string[] | null;
  category: ServiceCategory | null;
  placement_type: PlacementType;
  region_scope: string | null;
  town: string | null;
  postcode_district: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  response_rate: number | null;
  response_time_hours: number | null;
  years_in_business: number | null;
  completed_jobs_count: number | null;
  business_description: string | null;
  qualifications: string[] | null;
  portfolio_urls: string[] | null;
  location_match: "postcode" | "town" | "region" | "none";
  admin_featured: boolean;
  priority_override: number | null;
  budget_remaining: boolean;
};

/** The premium card model surfaced to buyers/renters. */
export type FeaturedExpert = {
  placementId: string;
  providerId: string;
  slug: string;
  businessName: string;
  avatarUrl: string | null;
  category: ServiceCategory | null;
  primaryService: string;
  placementType: PlacementType;
  averageRating: number | null;
  totalReviews: number;
  responseTimeHours: number | null;
  serviceArea: string | null;
  valueProposition: string | null;
  isVerified: boolean;
};

/** Dashboard performance summary for a single placement. */
export type PlacementPerformance = {
  placementId: string;
  impressions: number;
  clicks: number;
  enquiries: number;
  /** clicks / impressions */
  clickThroughRate: number;
  /** monthly_price / enquiries, in pence; null when no enquiries yet. */
  costPerEnquiryPence: number | null;
  /** enquiries / clicks */
  conversionRate: number;
};
