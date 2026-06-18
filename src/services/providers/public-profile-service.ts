/**
 * Public profile service — data fetching functions for service provider
 * and estate agent public profile pages.
 *
 * All functions use the Supabase server client and are safe for use in
 * Next.js Server Components. No authentication is required; anon RLS
 * policies control which rows are visible.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ServiceProviderPublicProfile,
  PortfolioItem,
  ProviderLead,
  ProviderService,
  PublicReview,
  AgentPublicProfile,
  AgentPublicStats,
  AgentTeamMember,
  PaginatedListings,
  AgentListingItem,
} from "@/types/providers";

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Service provider functions
// ---------------------------------------------------------------------------

/**
 * Fetches a verified service provider profile by their URL slug.
 * Queries service_provider_details with profiles and provider_rating_stats JOINs.
 * Returns null if no verified provider found with the given slug.
 */
export async function fetchProviderBySlug(
  slug: string,
): Promise<ServiceProviderPublicProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_provider_details")
    .select(
      `
      *,
      profiles (
        id,
        avatar_url,
        full_name:display_name,
        provider_verification_status
      ),
      provider_rating_stats (
        provider_id,
        average_rating,
        total_reviews,
        count_5_star,
        count_4_star,
        count_3_star,
        count_2_star,
        count_1_star
      )
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  // Defense-in-depth: ensure provider is publicly visible
  const profile = data.profiles as { provider_verification_status?: string } | null;
  if (profile?.provider_verification_status !== "verified") {
    return null;
  }

  return data as unknown as ServiceProviderPublicProfile;
}

/**
 * Fetches paginated approved reviews for a provider.
 * Queries reviews table with reviewer profile JOIN.
 *
 * @param providerId - UUID of the service_provider_details row
 * @param page - 1-based page number
 */
export async function fetchProviderReviews(
  providerId: string,
  page: number,
): Promise<{ reviews: PublicReview[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("reviews")
    .select(
      `
      *,
      profiles (
        full_name:display_name,
        avatar_url
      )
    `,
      { count: "exact" },
    )
    .eq("provider_id", providerId)
    .range(from, to);

  if (error || !data) {
    return { reviews: [], total: 0 };
  }

  return {
    reviews: data as unknown as PublicReview[],
    total: count ?? 0,
  };
}

/**
 * Fetches all portfolio items for a provider, ordered by sort_order.
 * Queries provider_portfolio_items table.
 *
 * @param providerId - UUID of the service_provider_details row
 */
export async function fetchPortfolioItems(
  providerId: string,
): Promise<PortfolioItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_portfolio_items")
    .select("*")
    .eq("provider_id", providerId)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as PortfolioItem[];
}

/**
 * Fetches active services offered by a provider.
 * Queries provider_services table filtered to is_active = true.
 *
 * @param providerId - UUID of the service_provider_details row
 */
export async function fetchProviderServices(
  providerId: string,
): Promise<ProviderService[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_services")
    .select("*")
    .eq("provider_id", providerId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as unknown as ProviderService[];
}

// ---------------------------------------------------------------------------
// Unused export to satisfy ProviderLead import (used in quote modal service)
// ---------------------------------------------------------------------------

export type { ProviderLead };

// ---------------------------------------------------------------------------
// Agent / agency functions
// ---------------------------------------------------------------------------

/**
 * Fetches a public agent profile by their URL slug.
 * Queries agent_agency_profiles with profiles and agency JOINs.
 * Returns null if no agent found with the given slug.
 */
export async function fetchAgentBySlug(
  slug: string,
): Promise<AgentPublicProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_agency_profiles")
    .select(
      `
      *,
      profiles (
        id,
        avatar_url,
        full_name:display_name
      )
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as AgentPublicProfile;
}

/**
 * Fetches aggregated public statistics for an agent via the
 * get_agent_public_stats RPC function.
 *
 * @param slug - URL slug for the agent
 */
export async function fetchAgentStats(
  slug: string,
): Promise<AgentPublicStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_agent_public_stats", {
    p_slug: slug,
  });

  if (error || !data) {
    return {
      active_listings_count: 0,
      sold_count: 0,
      avg_days_to_sell: null,
      avg_pct_asking: null,
      avg_rating: null,
      total_reviews: 0,
    };
  }

  const stats = data as Record<string, unknown>;
  return {
    active_listings_count: (stats.active_listings_count as number) ?? 0,
    sold_count: (stats.sold_count as number) ?? 0,
    avg_days_to_sell: (stats.avg_days_to_sell as number | null) ?? null,
    avg_pct_asking: (stats.avg_pct_asking as number | null) ?? null,
    avg_rating: (stats.avg_rating as number | null) ?? null,
    total_reviews: (stats.total_reviews as number) ?? 0,
  };
}

/**
 * Fetches paginated listings for an agent filtered by status group.
 * Queries listings table filtered by agent_id and status values.
 *
 * @param agentId - UUID of the agent (profiles.id)
 * @param status - "active" maps to for_sale/for_rent/under_offer; "sold_let" maps to sold/let
 * @param page - 1-based page number
 */
export async function fetchAgentListings(
  agentId: string,
  status: "active" | "sold_let",
  page: number,
): Promise<PaginatedListings> {
  const supabase = await createClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const statusValues =
    status === "active"
      ? ["for_sale", "for_rent", "under_offer"]
      : ["sold", "let"];

  const { data, error, count } = await supabase
    .from("listings")
    .select(
      `
      id,
      title,
      slug,
      price,
      sold_price,
      status,
      bedrooms,
      bathrooms,
      property_type,
      cover_image_url,
      address_line1,
      city,
      postcode,
      created_at,
      sold_at
    `,
      { count: "exact" },
    )
    .eq("agent_id", agentId)
    .in("status", statusValues)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { listings: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  return {
    listings: data as AgentListingItem[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Fetches team members for an agency.
 * Queries agent_agency_profiles filtered by agency_id with profiles JOIN.
 *
 * @param agencyId - UUID of the agency
 */
export async function fetchAgentTeam(
  agencyId: string,
): Promise<AgentTeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_agency_profiles")
    .select(
      `
      id,
      user_id,
      profiles (
        full_name:display_name,
        avatar_url
      ),
      role,
      bio
    `,
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((member) => {
    const profile = (Array.isArray(member.profiles) ? member.profiles[0] : member.profiles) as { full_name: string | null; avatar_url: string | null } | null;
    return {
      id: member.id as string,
      user_id: member.user_id as string,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: (member.role as string | null) ?? null,
      bio: (member.bio as string | null) ?? null,
    };
  });
}
