/**
 * area-directory-service.ts
 *
 * Organic (non-paid) provider directory for the /professionals area pages.
 * Verified providers in a category, rating-ordered — shown beneath the paid
 * Featured Local Experts so the page is useful (and SEO-worthy) even with no
 * advertisers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ServiceCategory } from "@/types/marketplace";

export type DirectoryProvider = {
  userId: string;
  businessName: string;
  slug: string;
  services: ServiceCategory[];
  averageRating: number | null;
  totalReviews: number;
  avatarUrl: string | null;
};

type Row = {
  user_id: string;
  business_name: string;
  slug: string;
  services: ServiceCategory[];
  provider_rating_stats: { average_rating: number | null; total_reviews: number | null } | null;
  profiles: { avatar_url: string | null } | null;
};

export async function listAreaProviders(
  supabase: SupabaseClient,
  category: ServiceCategory,
  limit = 12,
): Promise<DirectoryProvider[]> {
  const { data, error } = await supabase
    .from("service_provider_details")
    .select(
      `user_id, business_name, slug, services,
       profiles!inner ( avatar_url, provider_verification_status, deleted_at ),
       provider_rating_stats ( average_rating, total_reviews )`,
    )
    .filter("profiles.provider_verification_status", "eq", "verified")
    .filter("profiles.deleted_at", "is", null)
    .contains("services", [category])
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Row[])
    .map((r) => ({
      userId: r.user_id,
      businessName: r.business_name,
      slug: r.slug,
      services: r.services,
      averageRating: r.provider_rating_stats?.average_rating ?? null,
      totalReviews: r.provider_rating_stats?.total_reviews ?? 0,
      avatarUrl: r.profiles?.avatar_url ?? null,
    }))
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
}
