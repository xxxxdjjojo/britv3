/**
 * transform.ts
 *
 * Pure mappers between the `featured_experts_for` RPC rows and the application's
 * ranking candidates / display models, plus performance-metric derivation.
 */

import type {
  FeaturedExpert,
  FeaturedExpertRow,
  PlacementPerformance,
} from "@/types/sponsored-placements";

import { computeProfileCompleteness } from "./pricing";
import type { ExpertCandidate } from "./ranking";

function humanizeCategory(value: string): string {
  const label = value.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function rowToCandidate(row: FeaturedExpertRow): ExpertCandidate {
  return {
    providerId: row.provider_id,
    placementId: row.placement_id,
    averageRating: row.average_rating,
    totalReviews: row.total_reviews ?? 0,
    responseRate: row.response_rate,
    profileCompleteness: computeProfileCompleteness({
      businessName: row.business_name,
      businessDescription: row.business_description,
      services: row.services,
      servicePostcodes: row.service_postcodes,
      avatarUrl: row.avatar_url,
      qualifications: row.qualifications,
      portfolioUrls: row.portfolio_urls,
    }),
    locationMatch: row.location_match,
    categoryMatch: row.category != null,
    adminFeatured: row.admin_featured,
    priorityOverride: row.priority_override,
    budgetRemaining: row.budget_remaining,
  };
}

/** Build the buyer-facing premium card model. */
export function rowToExpert(row: FeaturedExpertRow): FeaturedExpert {
  const primarySource = row.category ?? (row.services ?? [])[0] ?? "other";
  const serviceArea = row.postcode_district ?? row.town ?? row.region_scope ?? null;
  return {
    placementId: row.placement_id,
    providerId: row.provider_id,
    slug: row.slug,
    businessName: row.business_name,
    avatarUrl: row.avatar_url,
    category: row.category,
    primaryService: humanizeCategory(primarySource),
    placementType: row.placement_type,
    averageRating: row.average_rating,
    totalReviews: row.total_reviews ?? 0,
    responseTimeHours: row.response_time_hours,
    serviceArea,
    valueProposition: row.business_description,
    isVerified: true,
  };
}

export function computePerformance(input: {
  placementId: string;
  impressions: number;
  clicks: number;
  enquiries: number;
  monthlyPricePence: number;
}): PlacementPerformance {
  const clickThroughRate = input.impressions > 0 ? input.clicks / input.impressions : 0;
  const conversionRate = input.clicks > 0 ? input.enquiries / input.clicks : 0;
  const costPerEnquiryPence = input.enquiries > 0 ? Math.round(input.monthlyPricePence / input.enquiries) : null;
  return {
    placementId: input.placementId,
    impressions: input.impressions,
    clicks: input.clicks,
    enquiries: input.enquiries,
    clickThroughRate,
    costPerEnquiryPence,
    conversionRate,
  };
}
