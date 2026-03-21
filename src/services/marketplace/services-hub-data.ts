/**
 * Data layer for the /services hub page.
 * Provides top-rated providers and category counts for the services landing page.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import type { ServiceCategory } from "@/types/marketplace";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch top-rated verified providers for the services hub hero carousel.
 * Returns up to 6 providers ordered by average rating (descending).
 */
export async function fetchTopRatedProviders(
  supabase: SupabaseClient
): Promise<ServiceProviderPublicProfile[]> {
  const { data, error } = await supabase
    .from("service_provider_details")
    .select(
      "*, profiles!inner(id, avatar_url, full_name, provider_verification_status, email), provider_rating_stats(provider_id, avg_rating, total_reviews, five_star, four_star, three_star, two_star, one_star)"
    )
    .eq("profiles.provider_verification_status", "verified")
    .order("avg_rating", { referencedTable: "provider_rating_stats", ascending: false })
    .limit(6);

  if (error) {
    console.error("fetchTopRatedProviders failed:", error.message);
    return [];
  }

  return (data ?? []) as ServiceProviderPublicProfile[];
}

/**
 * Fetch the count of verified providers per service category.
 * Queries all verified providers' services arrays and aggregates in JS.
 */
export async function fetchCategoryCounts(
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("service_provider_details")
    .select("services, profiles!inner(provider_verification_status)")
    .eq("profiles.provider_verification_status", "verified");

  if (error) {
    console.error("fetchCategoryCounts failed:", error.message);
    return {};
  }

  const counts: Record<string, number> = {};

  for (const row of data ?? []) {
    const services = (row as { services: ServiceCategory[] }).services;
    if (!Array.isArray(services)) continue;
    for (const category of services) {
      counts[category] = (counts[category] ?? 0) + 1;
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Fallback data (used when DB is unavailable or during SSG)
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

function makeFallbackProvider(
  id: string,
  slug: string,
  businessName: string,
  services: ServiceCategory[],
  city: string,
  avgRating: number,
  totalReviews: number
): ServiceProviderPublicProfile {
  return {
    id,
    user_id: `fallback-user-${id}`,
    slug,
    business_name: businessName,
    tagline: null,
    description: null,
    services,
    city,
    service_postcodes: null,
    website_url: null,
    phone: null,
    years_experience: null,
    qualifications: null,
    insurance_verified: true,
    created_at: now,
    updated_at: now,
    profiles: {
      id: `fallback-user-${id}`,
      avatar_url: null,
      full_name: businessName,
      provider_verification_status: "verified",
      email: null,
    },
    provider_rating_stats: {
      provider_id: id,
      avg_rating: avgRating,
      total_reviews: totalReviews,
      five_star: Math.round(totalReviews * 0.7),
      four_star: Math.round(totalReviews * 0.2),
      three_star: Math.round(totalReviews * 0.1),
      two_star: 0,
      one_star: 0,
    },
  };
}

export const FALLBACK_PROVIDERS: ServiceProviderPublicProfile[] = [
  makeFallbackProvider("fb-1", "premier-plumbing", "Premier Plumbing", ["plumber"], "London", 4.9, 48),
  makeFallbackProvider("fb-2", "sparks-electrical", "Sparks Electrical", ["electrician"], "Manchester", 4.8, 35),
  makeFallbackProvider("fb-3", "swift-conveyancing", "Swift Conveyancing", ["conveyancing"], "Birmingham", 4.7, 62),
  makeFallbackProvider("fb-4", "green-gardens", "Green Gardens Landscaping", ["landscaping"], "Bristol", 4.6, 29),
];

export const FALLBACK_COUNTS: Record<string, number> = {
  plumber: 124,
  electrician: 98,
  builder: 87,
  conveyancing: 65,
  surveying: 52,
  mortgage_broker: 71,
  cleaning: 110,
  handyman: 93,
};
