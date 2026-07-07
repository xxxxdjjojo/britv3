/**
 * Agent Viewing Service — manage viewing slots and feedback.
 * All operations scoped to authenticated agent via agentId.
 *
 * Host availability lives in the canonical `viewing_slots` table (the same table
 * the buyer-facing Book-a-Viewing modal reads), NOT the legacy
 * `agent_viewing_slots`. This service keeps the historical `AgentViewingSlot`
 * shape so its callers (agent dashboard, ViewingCalendar) need no change:
 *   property_id ⇐ listing_id, is_booked ⇐ (status === 'booked').
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentViewingSlot, AgentViewingFeedback } from "@/types/agent";

type ListingAddress = {
  title: string | null;
  address_line1: string | null;
  city: string | null;
  postcode: string | null;
};

type ViewingSlotRow = {
  id: string;
  listing_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  status: string;
  booked_by: string | null;
  notes: string | null;
  created_at: string;
  // Embedded via listing_id → listings → properties (absent on create/update
  // returns where the embed is not requested). A to-one embed resolves to an
  // object at runtime; the supabase-js select-string parser types it as an
  // array, so accept either shape and normalise in `firstOrSelf`.
  listings?: EmbeddedOne<{ properties: EmbeddedOne<ListingAddress> }>;
};

/** A PostgREST to-one embed: an object at runtime, array in the inferred type. */
type EmbeddedOne<T> = T | T[] | null;

/** Collapse a to-one embed (object, single-element array, or null) to T | null. */
function firstOrSelf<T>(value: EmbeddedOne<T> | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const SLOT_COLUMNS =
  "id, listing_id, agent_id, start_time, end_time, status, booked_by, notes, created_at, listings(properties(title, address_line1, city, postcode))";

/**
 * Build a human-readable property label (street + postcode, falling back to the
 * listing title) from the embedded listing address, or null when unavailable.
 */
function toPropertyLabel(
  address: ListingAddress | null | undefined,
): string | null {
  if (!address) return null;
  const line = [address.address_line1, address.postcode]
    .filter(Boolean)
    .join(", ");
  return line || address.title || null;
}

function toAgentSlot(row: ViewingSlotRow): AgentViewingSlot {
  return {
    id: row.id,
    agent_id: row.agent_id,
    property_id: row.listing_id,
    property_label: toPropertyLabel(
      firstOrSelf(firstOrSelf(row.listings)?.properties),
    ),
    start_time: row.start_time,
    end_time: row.end_time,
    is_booked: row.status === "booked",
    booked_by: row.booked_by,
    notes: row.notes,
    created_at: row.created_at,
  };
}

/**
 * Get all viewing slots for an agent, with optional property and date filters.
 */
export async function getAgentViewingSlots(
  supabase: SupabaseClient,
  agentId: string,
  propertyId?: string,
  dateRange?: { start: string; end: string },
): Promise<AgentViewingSlot[]> {
  let query = supabase
    .from("viewing_slots")
    .select(SLOT_COLUMNS)
    .eq("agent_id", agentId);

  if (propertyId) {
    query = query.eq("listing_id", propertyId);
  }

  if (dateRange) {
    query = query
      .gte("start_time", dateRange.start)
      .lte("start_time", dateRange.end);
  }

  const { data, error } = await query.order("start_time", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch viewing slots: ${error.message}`);
  }

  return ((data ?? []) as unknown as ViewingSlotRow[]).map(toAgentSlot);
}

/**
 * Create a new viewing slot for the agent.
 * Validates that end_time is after start_time.
 */
export async function createViewingSlot(
  supabase: SupabaseClient,
  agentId: string,
  input: {
    property_id: string;
    start_time: string;
    end_time: string;
    notes?: string;
  },
): Promise<AgentViewingSlot> {
  if (new Date(input.end_time) <= new Date(input.start_time)) {
    throw new Error("end_time must be after start_time");
  }

  const { data, error } = await supabase
    .from("viewing_slots")
    .insert({
      agent_id: agentId,
      listing_id: input.property_id,
      start_time: input.start_time,
      end_time: input.end_time,
      type: "in_person",
      status: "available",
      notes: input.notes ?? null,
    })
    .select(SLOT_COLUMNS)
    .single();

  if (error || !data) {
    // RLS denies inserts against a listing the caller does not own.
    if (error?.code === "42501") {
      throw new Error("You can only add viewing slots to your own listings");
    }
    throw new Error(
      `Failed to create viewing slot: ${error?.message ?? "no data"}`,
    );
  }

  return toAgentSlot(data as unknown as ViewingSlotRow);
}

/**
 * Update a viewing slot — only allowed when not booked.
 */
export async function updateViewingSlot(
  supabase: SupabaseClient,
  slotId: string,
  agentId: string,
  input: Partial<{ start_time: string; end_time: string; notes: string }>,
): Promise<AgentViewingSlot> {
  // Check the slot isn't already booked
  const { data: existing, error: fetchError } = await supabase
    .from("viewing_slots")
    .select("status")
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error(
      `Viewing slot not found: ${fetchError?.message ?? "no data"}`,
    );
  }

  if (existing.status === "booked") {
    throw new Error("Cannot update a booked viewing slot");
  }

  const { data, error } = await supabase
    .from("viewing_slots")
    .update(input)
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .select(SLOT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update viewing slot: ${error?.message ?? "no data"}`,
    );
  }

  return toAgentSlot(data as unknown as ViewingSlotRow);
}

/**
 * Delete a viewing slot — only allowed when not booked.
 */
export async function deleteViewingSlot(
  supabase: SupabaseClient,
  slotId: string,
  agentId: string,
): Promise<void> {
  // Check the slot isn't already booked
  const { data: existing, error: fetchError } = await supabase
    .from("viewing_slots")
    .select("status")
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error(
      `Viewing slot not found: ${fetchError?.message ?? "no data"}`,
    );
  }

  if (existing.status === "booked") {
    throw new Error("Cannot delete a booked viewing slot");
  }

  const { error } = await supabase
    .from("viewing_slots")
    .delete()
    .eq("id", slotId)
    .eq("agent_id", agentId);

  if (error) {
    throw new Error(`Failed to delete viewing slot: ${error.message}`);
  }
}

/**
 * Get viewing feedback for an agent, optionally filtered by property.
 */
export async function getViewingFeedback(
  supabase: SupabaseClient,
  agentId: string,
  propertyId?: string,
): Promise<AgentViewingFeedback[]> {
  if (propertyId) {
    // Availability moved to viewing_slots (there is no FK from feedback to embed),
    // so resolve the agent's slot ids for this listing, then filter feedback by
    // them in a second step.
    const { data: slots, error: slotsError } = await supabase
      .from("viewing_slots")
      .select("id")
      .eq("agent_id", agentId)
      .eq("listing_id", propertyId);

    if (slotsError) {
      throw new Error(`Failed to fetch viewing feedback: ${slotsError.message}`);
    }

    const slotIds = ((slots as Array<{ id: string }> | null) ?? []).map((s) => s.id);
    if (slotIds.length === 0) return [];

    const { data, error } = await supabase
      .from("agent_viewing_feedback")
      .select("*")
      .eq("agent_id", agentId)
      .in("viewing_slot_id", slotIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch viewing feedback: ${error.message}`);
    }

    return (data ?? []) as AgentViewingFeedback[];
  }

  const { data, error } = await supabase
    .from("agent_viewing_feedback")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch viewing feedback: ${error.message}`);
  }

  return (data ?? []) as AgentViewingFeedback[];
}

/**
 * Submit feedback for a completed viewing.
 */
export async function submitViewingFeedback(
  supabase: SupabaseClient,
  agentId: string,
  input: {
    viewing_slot_id: string;
    buyer_name: string;
    interest_level: number;
    price_opinion: string;
    likelihood_to_offer: string;
    comments?: string;
  },
): Promise<AgentViewingFeedback> {
  const { data, error } = await supabase
    .from("agent_viewing_feedback")
    .insert({
      agent_id: agentId,
      viewing_slot_id: input.viewing_slot_id,
      buyer_name: input.buyer_name,
      interest_level: input.interest_level,
      price_opinion: input.price_opinion,
      likelihood_to_offer: input.likelihood_to_offer,
      comments: input.comments ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to submit viewing feedback: ${error?.message ?? "no data"}`,
    );
  }

  return data as AgentViewingFeedback;
}
