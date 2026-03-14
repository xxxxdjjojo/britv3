/**
 * Agent listings service -- CRUD operations and analytics for estate agent
 * property listings.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type CreateListingInput = {
  title?: string;
  description?: string;
  price?: number;
  status?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  address_line_1?: string;
  city?: string;
  postcode?: string;
};

type ListingAnalytics = {
  views_over_time: Array<{ date: string; count: number }>;
  total_views: number;
  total_saves: number;
  total_enquiries: number;
};

/**
 * Fetches listings owned by the given agent (via user_id) with optional
 * status filter and cursor-based pagination.
 */
export async function getAgentListings(
  supabase: SupabaseClient,
  agentId: string,
  status?: string,
  cursor?: string,
  limit = 20,
) {
  let query = supabase
    .from("listings")
    .select("*")
    .eq("user_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const nextCursor =
    rows.length === limit
      ? (rows[rows.length - 1] as { created_at: string }).created_at
      : null;

  return { listings: rows, nextCursor };
}

/**
 * Returns analytics for a specific listing. Attempts to query the
 * listing_analytics_events_agent view/table; falls back to a zero-value
 * structure if it does not exist.
 */
export async function getListingAnalytics(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
): Promise<ListingAnalytics> {
  // Verify ownership first
  const { data: listing, error: ownerErr } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", agentId)
    .single();

  if (ownerErr || !listing) {
    throw new Error("Listing not found or access denied");
  }

  // Attempt to query analytics events table
  const { data, error } = await supabase
    .from("listing_analytics_events_agent")
    .select("event_date, event_type, count")
    .eq("listing_id", listingId);

  if (error) {
    // Table may not exist yet — return zero-value structure
    return {
      views_over_time: [],
      total_views: 0,
      total_saves: 0,
      total_enquiries: 0,
    };
  }

  const rows = data ?? [];

  const viewRows = rows.filter((r) => r.event_type === "view");
  const views_over_time = viewRows.map((r) => ({
    date: r.event_date as string,
    count: r.count as number,
  }));

  const total_views = viewRows.reduce((s, r) => s + (r.count as number), 0);
  const total_saves = rows
    .filter((r) => r.event_type === "save")
    .reduce((s, r) => s + (r.count as number), 0);
  const total_enquiries = rows
    .filter((r) => r.event_type === "enquiry")
    .reduce((s, r) => s + (r.count as number), 0);

  return { views_over_time, total_views, total_saves, total_enquiries };
}

/**
 * Creates a new listing owned by the given agent.
 */
export async function createAgentListing(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateListingInput,
) {
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...input, user_id: agentId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates a listing, verifying that the agent owns it via user_id.
 */
export async function updateAgentListing(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
  input: Partial<CreateListingInput>,
) {
  const { data, error } = await supabase
    .from("listings")
    .update(input)
    .eq("id", listingId)
    .eq("user_id", agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Archives a listing (sets status to 'archived').
 */
export async function archiveListing(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
) {
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("id", listingId)
    .eq("user_id", agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Restores an archived listing to draft status.
 */
export async function restoreListing(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string,
) {
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "draft" })
    .eq("id", listingId)
    .eq("user_id", agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
