/**
 * JSON-LD generator utilities for provider public profile pages.
 *
 * Generates schema.org-compliant structured data for SEO and rich results.
 * All functions are pure — no Supabase calls, no "use client".
 */

import type { ServiceProviderPublicProfile, AgentPublicProfile, AgentPublicStats } from "@/types/providers";

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

/**
 * Builds a schema.org RealEstateAgent JSON-LD object for an estate agent profile.
 *
 * @param agency - The fetched agent profile (with embedded agency data)
 * @param stats - Aggregated public stats from get_agent_public_stats RPC
 * @returns A JSON-LD object ready to be stringified into a <script> tag
 */
export function buildAgentJsonLd(
  agency: AgentPublicProfile,
  stats: AgentPublicStats,
): Record<string, unknown> {
  const agencyName = agency.agency?.name ?? agency.display_name;
  const url = `https://britestate.co.uk/agents/${agency.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agencyName,
    url,
  };

  if (agency.bio) {
    jsonLd.description = agency.bio;
  }

  if (agency.phone) {
    jsonLd.telephone = agency.phone;
  }

  const agencyAddress = agency.agency?.address ?? null;
  if (agencyAddress) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: agencyAddress,
      addressCountry: "GB",
    };
  }

  if (agency.agency?.logo_url) {
    jsonLd.image = agency.agency.logo_url;
  }

  if (stats.avg_rating != null && stats.total_reviews > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.avg_rating,
      reviewCount: stats.total_reviews,
      bestRating: "5",
    };
  }

  return jsonLd;
}
