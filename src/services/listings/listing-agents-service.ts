/**
 * Listing Agents Service — owner-side representation management.
 * All operations are scoped to the authenticated caller's Supabase client (RLS
 * enforced at the DB layer). Only the listing owner can assign or remove agents.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ListingAgent = Readonly<{
  agent_id: string;
  display_name: string | null;
  created_at: string;
}>;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Assign an agent to a listing (insert an active row in `listing_agents`).
 * Idempotent: a 23505 unique-violation (active representation already exists)
 * is treated as success. A 42501 RLS denial is surfaced as a friendly error.
 */
export async function assignAgent(
  supabase: SupabaseClient,
  input: { listingId: string; agentId: string; createdBy: string },
): Promise<void> {
  const { error } = await supabase.from("listing_agents").insert({
    listing_id: input.listingId,
    agent_id: input.agentId,
    created_by: input.createdBy,
    status: "active",
  });

  if (!error) return;

  if (error.code === "23505") {
    // Already represented — treat as success.
    return;
  }

  if (error.code === "42501") {
    throw new Error("Only the listing owner can assign an agent");
  }

  throw new Error(error.message);
}

/**
 * Soft-remove a represented agent by setting status to 'removed'.
 * Maintains `updated_at` so the owner can audit when representation ended.
 */
export async function removeAgent(
  supabase: SupabaseClient,
  input: { listingId: string; agentId: string },
): Promise<void> {
  const { error } = await supabase
    .from("listing_agents")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("listing_id", input.listingId)
    .eq("agent_id", input.agentId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Return the listing ids that an agent actively represents.
 * Used to scope viewing slot and pending-request queries.
 */
export async function getRepresentedListings(
  supabase: SupabaseClient,
  agentId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("listing_agents")
    .select("listing_id")
    .eq("agent_id", agentId)
    .eq("status", "active");

  return ((data as Array<{ listing_id: string }> | null) ?? []).map(
    (r) => r.listing_id,
  );
}

/**
 * Return all actively represented agents for a listing, with their display
 * names resolved from `profiles` (second query — no FK embed available).
 */
export async function getListingAgents(
  supabase: SupabaseClient,
  listingId: string,
): Promise<ListingAgent[]> {
  const { data: rows } = await supabase
    .from("listing_agents")
    .select("agent_id, created_at")
    .eq("listing_id", listingId)
    .eq("status", "active");

  const agents = (rows as Array<{ agent_id: string; created_at: string }> | null) ?? [];
  if (agents.length === 0) return [];

  const agentIds = agents.map((a) => a.agent_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", agentIds);

  const nameMap = new Map<string, string | null>(
    ((profiles as Array<{ id: string; display_name: string | null }> | null) ?? []).map(
      (p) => [p.id, p.display_name ?? null],
    ),
  );

  return agents.map((a) => ({
    agent_id: a.agent_id,
    display_name: nameMap.get(a.agent_id) ?? null,
    created_at: a.created_at,
  }));
}
