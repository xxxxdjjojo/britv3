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
        full_name,
        provider_verification_status,
        email
      ),
      provider_rating_stats (
        provider_id,
        avg_rating,
        total_reviews,
        five_star,
        four_star,
        three_star,
        two_star,
        one_star
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

  // No FK from reviews to profiles — query separately
  const { data, error, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("provider_id", providerId)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { reviews: [], total: 0 };
  }

  // Fetch reviewer profiles
  const reviewerIds = data.map((r) => (r as Record<string, unknown>).reviewer_id).filter(Boolean) as string[];
  let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (reviewerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", reviewerIds);
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, { full_name: p.display_name, avatar_url: p.avatar_url });
      }
    }
  }

  const reviews = data.map((row) => {
    const r = row as Record<string, unknown>;
    const reviewerId = r.reviewer_id as string;
    const profile = profileMap.get(reviewerId) ?? { full_name: null, avatar_url: null };
    return {
      ...row,
      body: r.review_text ?? null,
      profiles: profile,
    };
  });

  return {
    reviews: reviews as unknown as PublicReview[],
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

  // Fetch agent profile — no FK from agent_agency_profiles to profiles,
  // so we query them separately and stitch together.
  const { data, error } = await supabase
    .from("agent_agency_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  // Fetch the linked profile via user_id or agent_id
  const profileId = (data as Record<string, unknown>).user_id ?? (data as Record<string, unknown>).agent_id;
  let profiles: { id: string; avatar_url: string | null; full_name: string | null; email: string | null } = {
    id: String(profileId ?? ""),
    avatar_url: null,
    full_name: null,
    email: null,
  };

  if (profileId) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, avatar_url, display_name")
      .eq("id", String(profileId))
      .single();

    if (profileData) {
      profiles = {
        id: profileData.id,
        avatar_url: profileData.avatar_url,
        full_name: profileData.display_name,
        email: null,
      };
    }
  }

  // Map DB columns to the AgentPublicProfile shape
  const row = data as Record<string, unknown>;
  const result = {
    ...data,
    profiles,
    phone: row.contact_phone ?? null,
    email: row.contact_email ?? null,
    areas_covered: row.coverage_areas ?? [],
    specialisations: row.specializations ?? [],
    agency: row.agency_name
      ? {
          id: String(row.agency_id ?? row.id),
          name: String(row.agency_name),
          logo_url: (row.logo_url as string | null) ?? null,
          website_url: (row.website_url as string | null) ?? null,
          address: [row.address_line_1, row.address_line_2, row.city, row.postcode]
            .filter(Boolean)
            .join(", "),
        }
      : null,
  };

  return result as unknown as AgentPublicProfile;
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
      slug,
      price,
      status,
      listing_type,
      created_at,
      properties (
        title,
        bedrooms,
        bathrooms,
        property_type,
        address_line1,
        city,
        postcode
      )
    `,
      { count: "exact" },
    )
    .eq("user_id", agentId)
    .in("status", statusValues)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { listings: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  // Map the JOIN result to the AgentListingItem shape
  const listings = data.map((row) => {
    const r = row as Record<string, unknown>;
    const prop = (r.properties ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      title: prop.title ?? "Untitled",
      slug: r.slug,
      price: r.price,
      sold_price: null,
      status: r.status,
      bedrooms: prop.bedrooms ?? null,
      bathrooms: prop.bathrooms ?? null,
      property_type: prop.property_type ?? null,
      cover_image_url: null,
      address_line1: prop.address_line1 ?? null,
      city: prop.city ?? null,
      postcode: prop.postcode ?? null,
      created_at: r.created_at,
      sold_at: null,
    };
  });

  return {
    listings: listings as AgentListingItem[],
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

  // No FK from agent_agency_profiles to profiles — query separately
  const { data, error } = await supabase
    .from("agent_agency_profiles")
    .select("id, user_id, agent_id, display_name, role, bio")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  // Fetch profile data for each team member
  const userIds = data
    .map((m) => (m as Record<string, unknown>).user_id ?? (m as Record<string, unknown>).agent_id)
    .filter(Boolean) as string[];

  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
      }
    }
  }

  return data.map((member) => {
    const m = member as Record<string, unknown>;
    const profileId = (m.user_id ?? m.agent_id) as string | null;
    const profile = profileId ? profileMap.get(profileId) : null;
    return {
      id: m.id as string,
      user_id: (m.user_id ?? m.agent_id ?? "") as string,
      full_name: profile?.display_name ?? (m.display_name as string | null) ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: (m.role as string | null) ?? null,
      bio: (m.bio as string | null) ?? null,
    };
  });
}
