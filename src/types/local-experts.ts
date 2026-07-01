/**
 * local-experts.ts
 *
 * Domain types for the property page's "Local experts who can help with this
 * property" section. A LocalExpert is the unified card model surfaced to
 * buyers/renters — it blends ORGANIC verified traders (from the
 * `local_experts_for_property` RPC) with a small, clearly-labelled number of
 * SPONSORED placements (from `featured_experts_for`). Sponsored cards never
 * bypass verification.
 */

import type { ServiceCategory } from "@/types/marketplace";
import type { LocationMatch } from "@/lib/placements/ranking";

/** A row returned by the `local_experts_for_property` RPC (organic candidate). */
export type LocalExpertRow = {
  provider_id: string;
  business_name: string;
  slug: string;
  avatar_url: string | null;
  services: ServiceCategory[];
  service_postcodes: string[] | null;
  primary_category: ServiceCategory | null;
  average_rating: number | null;
  total_reviews: number | null;
  response_rate: number | null;
  response_time_hours: number | null;
  years_in_business: number | null;
  completed_jobs_count: number | null;
  business_description: string | null;
  qualifications: string[] | null;
  portfolio_urls: string[] | null;
  location_match: LocationMatch;
};

/** The buyer/renter-facing card model for a local expert. */
export type LocalExpert = {
  providerId: string;
  slug: string;
  businessName: string;
  avatarUrl: string | null;
  category: ServiceCategory | null;
  /** Human-readable trade label, e.g. "Plumber". */
  primaryService: string;
  averageRating: number | null;
  totalReviews: number;
  responseTimeHours: number | null;
  yearsInBusiness: number | null;
  completedJobsCount: number | null;
  serviceArea: string | null;
  valueProposition: string | null;
  isVerified: boolean;
  /** Paid placement — render the "Sponsored" label. */
  isSponsored: boolean;
  /** The placement id, when sponsored, for durable placement analytics. */
  placementId: string | null;
};
