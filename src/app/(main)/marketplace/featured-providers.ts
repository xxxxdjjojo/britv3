import { createClient } from "@/lib/supabase/server";

export type FeaturedProvider = Readonly<{
  providerId: string;
  slug: string;
  businessName: string;
  displayName: string | null;
  city: string | null;
  services: string[];
  avatarUrl: string | null;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
}>;

type FeaturedRow = Readonly<{
  provider_id: string;
  average_rating: number;
  total_reviews: number;
  service_provider_details: {
    slug: string;
    business_name: string;
    services: string[] | null;
    service_postcodes: string[] | null;
    profiles: {
      avatar_url: string | null;
      full_name: string | null;
      provider_verification_status: string | null;
    };
  };
}>;

/**
 * Top-rated featured providers for the marketplace hub.
 *
 * Reads the real `provider_rating_stats` aggregate joined to provider details
 * and the owning profile. Mirrors the original landing query exactly so no
 * displayed data changes. Returns an empty list on error or seed-empty state —
 * the hub handles that gracefully.
 */
export async function getFeaturedProviders(limit = 6): Promise<FeaturedProvider[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_rating_stats")
    .select(
      "provider_id, average_rating, total_reviews, service_provider_details!inner(slug, business_name, services, service_postcodes, profiles!inner(avatar_url, full_name:display_name, provider_verification_status))",
    )
    .order("average_rating", { ascending: false })
    .gt("total_reviews", 5)
    .limit(limit);

  const rows = (data ?? []) as unknown as FeaturedRow[];

  return rows.map((row) => {
    const details = row.service_provider_details;
    const profile = details.profiles;
    return {
      providerId: row.provider_id,
      slug: details.slug,
      businessName: details.business_name,
      displayName: profile.full_name,
      city: details.service_postcodes?.[0] ?? null,
      services: details.services ?? [],
      avatarUrl: profile.avatar_url,
      isVerified: profile.provider_verification_status === "verified",
      averageRating: row.average_rating,
      totalReviews: row.total_reviews,
    };
  });
}
