/**
 * Property detail service.
 *
 * Provides data-fetching helpers for the property detail page:
 *   - Full listing bundle (cached in Redis 5 min)
 *   - Price history
 *   - Insight cache read/write (property_insights table)
 *   - Anonymous view tracking (fire-and-forget)
 *   - Live viewer count
 *   - Similar listings (via search_listings materialized view)
 *   - Save-state check (saved_properties)
 *   - Renovation benchmarks
 *
 * All functions accept a SupabaseClient as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getCached, setCache } from "@/lib/cache/redis";
import type {
  PropertyDetailData,
  AgentProfile,
  PropertyInsight,
  RenovationBenchmark,
  SimilarListing,
} from "@/types/property-detail";
import type { PriceHistory } from "@/types/property";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLUG_CACHE_TTL = 5 * 60; // 5 minutes in seconds
const VISIBLE_STATUSES = ["active", "under_offer", "sold_stc", "sold"] as const;
const DEFAULT_VIEW_WINDOW_MINUTES = 30;
const DEFAULT_SIMILAR_LIMIT = 3;

// ---------------------------------------------------------------------------
// getListingBySlug
// ---------------------------------------------------------------------------

/**
 * Fetch full property detail by listing slug.
 * Cached 5 minutes in Redis (key: `prop:slug:{slug}`).
 * Returns null if not found or listing has a non-visible status.
 */
export async function getListingBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PropertyDetailData | null> {
  const cacheKey = `prop:slug:${slug}`;

  const cached = await getCached<PropertyDetailData>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch listing + property in one query
  const { data: listingRow, error: listingError } = await supabase
    .from("listings")
    .select("*, properties(*)")
    .eq("slug", slug)
    .in("status", VISIBLE_STATUSES)
    .is("deleted_at", null)
    .single();

  if (listingError || !listingRow) {
    return null;
  }

  // Supabase embeds the joined relation under the relation name
  const propertyRow = (listingRow as Record<string, unknown>).properties as Record<string, unknown>;
  if (!propertyRow) {
    return null;
  }

  // Strip nested relation to get a clean Listing object
  const { properties: _ignored, ...listingData } = listingRow as Record<string, unknown>;
  void _ignored;

  // Fetch media ordered by sort_order
  const { data: mediaRows } = await supabase
    .from("property_media")
    .select("*")
    .eq("listing_id", listingData.id as string)
    .order("sort_order", { ascending: true });

  // Fetch price history
  const { data: priceHistoryRows } = await supabase
    .from("price_history")
    .select("*")
    .eq("listing_id", listingData.id as string)
    .order("changed_at", { ascending: false });

  // Fetch agent profile (profiles LEFT JOIN agent_agency_profiles)
  const agentProfile = await _fetchAgentProfile(supabase, listingData.user_id as string);

  const result: PropertyDetailData = {
    listing: listingData as unknown as PropertyDetailData["listing"],
    property: propertyRow as unknown as PropertyDetailData["property"],
    media: (mediaRows ?? []) as PropertyDetailData["media"],
    priceHistory: (priceHistoryRows ?? []) as unknown as PriceHistory[],
    agentProfile,
  };

  // Populate cache — non-blocking
  setCache(cacheKey, result, SLUG_CACHE_TTL).catch((err: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[property-detail-service] Redis cache write failed:", err instanceof Error ? err.message : err);
    }
  });

  return result;
}

// ---------------------------------------------------------------------------
// _fetchAgentProfile (internal helper)
// ---------------------------------------------------------------------------

async function _fetchAgentProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<AgentProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, phone")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  // Fetch optional agency profile
  const { data: agencyProfile } = await supabase
    .from("agent_agency_profiles")
    .select("agency_name, contact_phone")
    .eq("agent_id", userId)
    .maybeSingle();

  return {
    id: profile.id as string,
    display_name: (profile.display_name as string | null) ?? "",
    avatar_url: profile.avatar_url as string | null,
    agency_name: agencyProfile ? (agencyProfile.agency_name as string | null) : null,
    // Prefer agency contact_phone over profile phone when available
    phone: agencyProfile
      ? ((agencyProfile.contact_phone as string | null) ?? (profile.phone as string | null))
      : (profile.phone as string | null),
    // Rating and review_count are not yet aggregated in the DB schema;
    // return null/0 as safe defaults until a reviews migration is added.
    rating: null,
    review_count: 0,
  };
}

// ---------------------------------------------------------------------------
// getPriceHistoryForListing
// ---------------------------------------------------------------------------

/**
 * Fetch price history rows for a listing, newest first.
 */
export async function getPriceHistoryForListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from("price_history")
    .select("*")
    .eq("listing_id", listingId)
    .order("changed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch price history: ${error.message}`);
  }

  return (data ?? []) as unknown as PriceHistory[];
}

// ---------------------------------------------------------------------------
// getPropertyInsight
// ---------------------------------------------------------------------------

/**
 * Return a cached property insight from the property_insights table.
 * Returns null if the row doesn't exist or if expires_at has passed.
 */
export async function getPropertyInsight(
  supabase: SupabaseClient,
  propertyId: string,
  insightType: PropertyInsight["insight_type"],
): Promise<PropertyInsight | null> {
  const { data, error } = await supabase
    .from("property_insights")
    .select("*")
    .eq("property_id", propertyId)
    .eq("insight_type", insightType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Check expiry client-side (belt-and-suspenders; DB policy still applies)
  const expiresAt = (data as Record<string, unknown>).expires_at as string | null;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return null;
  }

  return data as unknown as PropertyInsight;
}

// ---------------------------------------------------------------------------
// setPropertyInsight
// ---------------------------------------------------------------------------

/**
 * Upsert a property insight row.
 * Computes expires_at from the current time + ttlSeconds.
 */
export async function setPropertyInsight(
  supabase: SupabaseClient,
  propertyId: string,
  insightType: PropertyInsight["insight_type"],
  data: unknown,
  ttlSeconds: number,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

  const { error } = await supabase.from("property_insights").upsert(
    {
      property_id: propertyId,
      insight_type: insightType,
      data,
      fetched_at: now.toISOString(),
      expires_at: expiresAt,
    },
    { onConflict: "property_id,insight_type" },
  );

  if (error) {
    throw new Error(`Failed to set property insight: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// getPropertyViewCount
// ---------------------------------------------------------------------------

/**
 * Count distinct view events for a property within the last N minutes.
 * Uses the service_role key when present so it can read property_views rows
 * (RLS restricts SELECT to service_role).
 */
export async function getPropertyViewCount(
  supabase: SupabaseClient,
  propertyId: string,
  sinceMinutes = DEFAULT_VIEW_WINDOW_MINUTES,
): Promise<number> {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("property_views")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .gte("created_at", since);

  if (error) {
    // Degrade gracefully — view count is not critical
    return 0;
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// recordPropertyView
// ---------------------------------------------------------------------------

/**
 * Record an anonymous page view. Fire-and-forget — never throws.
 */
export async function recordPropertyView(
  supabase: SupabaseClient,
  propertyId: string,
  sessionId: string,
): Promise<void> {
  try {
    await supabase.from("property_views").insert({
      property_id: propertyId,
      session_id: sessionId,
    });
  } catch {
    // Intentionally swallowed — view tracking must not affect page load
  }
}

// ---------------------------------------------------------------------------
// getSimilarListings
// ---------------------------------------------------------------------------

/**
 * Return up to `limit` active listings that share the same city and
 * property_type, excluding the source property.
 *
 * Queries the search_listings materialized view (which only contains
 * active listings) for performance.
 */
export async function getSimilarListings(
  supabase: SupabaseClient,
  propertyId: string,
  city: string,
  propertyType: string,
  limit = DEFAULT_SIMILAR_LIMIT,
): Promise<SimilarListing[]> {
  const { data, error } = await supabase
    .from("search_listings")
    .select("listing_id, slug, title, price, bedrooms, property_type, city, thumbnail_url")
    .eq("city", city)
    .eq("property_type", propertyType)
    .neq("property_id", propertyId)
    .limit(limit);

  if (error) {
    // Degrade gracefully — similar listings are non-critical
    return [];
  }

  return (data ?? []) as SimilarListing[];
}

// ---------------------------------------------------------------------------
// getSaveState
// ---------------------------------------------------------------------------

/**
 * Return whether the user has saved a listing and any attached notes.
 */
export async function getSaveState(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<{ saved: boolean; notes: string | null }> {
  const { data } = await supabase
    .from("saved_properties")
    .select("notes")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (!data) {
    return { saved: false, notes: null };
  }

  return { saved: true, notes: (data as Record<string, unknown>).notes as string | null };
}

// ---------------------------------------------------------------------------
// getRenovationBenchmarks
// ---------------------------------------------------------------------------

/**
 * Fetch renovation benchmarks for a UK region.
 * Returns an empty array if the table has no rows for the given region.
 */
export async function getRenovationBenchmarks(
  supabase: SupabaseClient,
  region: string,
): Promise<RenovationBenchmark[]> {
  const { data, error } = await supabase
    .from("renovation_type_benchmarks")
    .select("*")
    .eq("region", region)
    .order("renovation_type", { ascending: true });

  if (error) {
    // Table may not be seeded yet — return empty array
    return [];
  }

  return (data ?? []) as unknown as RenovationBenchmark[];
}
