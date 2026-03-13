/**
 * JSON-LD generator utilities for provider public profile pages.
 *
 * Generates schema.org-compliant structured data for SEO and rich results.
 * All functions are pure — no Supabase calls, no "use client".
 */

import type { ServiceProviderPublicProfile } from "@/types/providers";

/**
 * Builds a schema.org LocalBusiness JSON-LD object for a service provider.
 *
 * @param provider - The fetched provider profile
 * @param category - The URL category slug (e.g. "plumbers")
 * @returns A JSON-LD object ready to be stringified into a <script> tag
 */
export function buildProviderJsonLd(
  provider: ServiceProviderPublicProfile,
  category: string,
): Record<string, unknown> {
  const url = `https://britestate.co.uk/services/${category}/${provider.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.business_name,
    description: provider.description ?? undefined,
    url,
  };

  if (provider.city) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressLocality: provider.city,
      addressCountry: "GB",
    };
  }

  if (provider.profiles.avatar_url) {
    jsonLd.image = provider.profiles.avatar_url;
  }

  if (provider.provider_rating_stats && provider.provider_rating_stats.total_reviews > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: provider.provider_rating_stats.avg_rating ?? 0,
      reviewCount: provider.provider_rating_stats.total_reviews,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return jsonLd;
}
