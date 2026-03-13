/**
 * Agent viewing service -- CRUD for viewing slots and feedback collection.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentViewingSlot,
  AgentViewingFeedback,
  InterestLevel,
  PriceOpinion,
  LikelihoodToOffer,
} from "@/types/agent";

// -- Service functions --------------------------------------------------------

/**
 * List viewing slots for an agent, optionally filtered by property and/or date
 * range. Results are ordered by start_time ascending.
 */
export async function getAgentViewingSlots(
  supabase: SupabaseClient,
  agentId: string,
  propertyId?: string,
  dateRange?: { start: string; end: string },
): Promise<AgentViewingSlot[]> {
  let query = supabase
    .from("agent_viewing_slots")
    .select("*")
    .eq("agent_id", agentId)
    .order("start_time", { ascending: true });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (dateRange) {
    query = query
      .gte("start_time", dateRange.start)
      .lte("start_time", dateRange.end);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch viewing slots: ${error.message}`);
  }

  return (data ?? []) as AgentViewingSlot[];
}

/**
 * Create a new viewing slot. Validates that end_time is after start_time.
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
    throw new Error("End time must be after start time");
  }

  const { data, error } = await supabase
    .from("agent_viewing_slots")
    .insert({
      agent_id: agentId,
      property_id: input.property_id,
      start_time: input.start_time,
      end_time: input.end_time,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create viewing slot: ${error.message}`);
  }

  return data as AgentViewingSlot;
}

/**
 * Update an existing viewing slot. Only allowed when the slot has not been
 * booked yet.
 */
export async function updateViewingSlot(
  supabase: SupabaseClient,
  slotId: string,
  agentId: string,
  input: Partial<{ start_time: string; end_time: string; notes: string }>,
): Promise<AgentViewingSlot> {
  // Check the slot is not already booked
  const { data: existing, error: fetchErr } = await supabase
    .from("agent_viewing_slots")
    .select("is_booked")
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .single();

  if (fetchErr || !existing) {
    throw new Error(fetchErr?.message ?? "Viewing slot not found");
  }

  if ((existing as Record<string, unknown>).is_booked) {
    throw new Error("Cannot update a booked viewing slot");
  }

  const { data, error } = await supabase
    .from("agent_viewing_slots")
    .update(input)
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update viewing slot: ${error.message}`);
  }

  return data as AgentViewingSlot;
}

/**
 * Delete a viewing slot. Only allowed when the slot has not been booked.
 */
export async function deleteViewingSlot(
  supabase: SupabaseClient,
  slotId: string,
  agentId: string,
): Promise<void> {
  // Check the slot is not already booked
  const { data: existing, error: fetchErr } = await supabase
    .from("agent_viewing_slots")
    .select("is_booked")
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .single();

  if (fetchErr || !existing) {
    throw new Error(fetchErr?.message ?? "Viewing slot not found");
  }

  if ((existing as Record<string, unknown>).is_booked) {
    throw new Error("Cannot delete a booked viewing slot");
  }

  const { error } = await supabase
    .from("agent_viewing_slots")
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
  let query = supabase
    .from("agent_viewing_feedback")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (propertyId) {
    // Join through viewing slot to filter by property
    query = supabase
      .from("agent_viewing_feedback")
      .select("*, agent_viewing_slots!inner(property_id)")
      .eq("agent_id", agentId)
      .eq("agent_viewing_slots.property_id", propertyId)
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query;

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
    interest_level: InterestLevel;
    price_opinion: PriceOpinion;
    likelihood_to_offer: LikelihoodToOffer;
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

  if (error) {
    throw new Error(`Failed to submit viewing feedback: ${error.message}`);
  }

  return data as AgentViewingFeedback;
}
