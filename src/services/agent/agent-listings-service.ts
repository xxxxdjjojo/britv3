/**
 * Agent listings service -- CRUD and analytics for agent property listings.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// -- Option / return types ----------------------------------------------------

export type ListingsQueryOptions = Readonly<{
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}>;

export type ListingsPage = Readonly<{
  data: Record<string, unknown>[];
  count: number;
}>;

export type DailyView = Readonly<{
  date: string;
  count: number;
}>;

export type ListingAnalytics = Readonly<{
  daily_views: DailyView[];
  total_views: number;
  total_saves: number;
  total_enquiries: number;
}>;

// -- Service functions --------------------------------------------------------

/**
 * Fetch paginated listings owned by an agent, with optional status filter and
 * sorting.
 */
export async function getAgentListings(
  supabase: SupabaseClient,
  agentId: string,
  options: ListingsQueryOptions = {},
): Promise<ListingsPage> {
  const { status, page = 1, limit = 20, sortBy = "created_at" } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("agent_id", agentId)
    .order(sortBy, { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch agent listings: ${error.message}`);
  }

  return {
    data: (data ?? []) as Record<string, unknown>[],
    count: count ?? 0,
  };
}

/**
 * Aggregate listing analytics from platform_events for the last 30 days.
 * Uses entity_type = 'listing' filtered by entity_id.
 */
export async function getListingAnalytics(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
): Promise<ListingAnalytics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const { data: events, error } = await supabase
    .from("platform_events")
    .select("event_type, created_at")
    .eq("entity_type", "listing")
    .eq("entity_id", listingId)
    .eq("actor_id", agentId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch listing analytics: ${error.message}`);
  }

  const rows = (events ?? []) as { event_type: string; created_at: string }[];

  // Aggregate daily views
  const dailyMap = new Map<string, number>();
  let totalViews = 0;
  let totalSaves = 0;
  let totalEnquiries = 0;

  for (const row of rows) {
    const date = row.created_at.split("T")[0];

    if (row.event_type === "listing_view") {
      totalViews++;
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
    } else if (row.event_type === "listing_save") {
      totalSaves++;
    } else if (row.event_type === "listing_enquiry") {
      totalEnquiries++;
    }
  }

  const daily_views: DailyView[] = Array.from(dailyMap.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  return { daily_views, total_views: totalViews, total_saves: totalSaves, total_enquiries: totalEnquiries };
}

/**
 * Create a new listing for an agent.
 */
export async function createAgentListing(
  supabase: SupabaseClient,
  agentId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...input, agent_id: agentId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Update an existing listing. Ownership is enforced by matching agent_id.
 */
export async function updateAgentListing(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("listings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Archive a listing (soft-delete by setting status to 'archived').
 */
export async function archiveListing(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to archive listing: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Restore an archived listing back to draft status.
 */
export async function restoreListing(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to restore listing: ${error.message}`);
  }

  return data as Record<string, unknown>;
}
