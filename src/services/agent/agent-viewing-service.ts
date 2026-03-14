/**
 * Agent viewing service — CRUD for viewing slots and post-viewing feedback.
 * All monetary values are in pence. All timestamps are ISO 8601 strings.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentViewingSlot,
  AgentViewingFeedback,
  CreateViewingSlotInput,
  CreateViewingFeedbackInput,
} from "@/types/agent";

// ============================================================================
// Viewing slot functions
// ============================================================================

/**
 * List viewing slots for an agent, with optional filters by property and date range.
 * Includes booked_by profile name via join when slot is booked.
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
 * Create a new viewing slot for a property.
 * Validates that end_time is after start_time.
 */
export async function createViewingSlot(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateViewingSlotInput,
): Promise<AgentViewingSlot> {
  const start = new Date(input.start_time);
  const end = new Date(input.end_time);

  if (end <= start) {
    throw new Error("end_time must be after start_time");
  }

  const { data, error } = await supabase
    .from("agent_viewing_slots")
    .insert({
      agent_id: agentId,
      property_id: input.property_id,
      start_time: input.start_time,
      end_time: input.end_time,
      notes: input.notes ?? null,
      is_booked: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create viewing slot: ${error.message}`);
  }

  return data as AgentViewingSlot;
}

/**
 * Update a viewing slot.
 * Only allowed if the slot has not yet been booked.
 */
export async function updateViewingSlot(
  supabase: SupabaseClient,
  slotId: string,
  agentId: string,
  input: Partial<CreateViewingSlotInput>,
): Promise<AgentViewingSlot> {
  // Fetch current slot to check booked status
  const { data: existing, error: fetchError } = await supabase
    .from("agent_viewing_slots")
    .select("is_booked")
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Viewing slot not found or access denied");
  }

  if (existing.is_booked) {
    throw new Error("Cannot update a viewing slot that has already been booked");
  }

  // Validate time range if both times provided
  if (input.start_time && input.end_time) {
    const start = new Date(input.start_time);
    const end = new Date(input.end_time);
    if (end <= start) {
      throw new Error("end_time must be after start_time");
    }
  }

  const { data, error } = await supabase
    .from("agent_viewing_slots")
    .update({
      ...(input.property_id !== undefined && { property_id: input.property_id }),
      ...(input.start_time !== undefined && { start_time: input.start_time }),
      ...(input.end_time !== undefined && { end_time: input.end_time }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
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
 * Delete a viewing slot.
 * Only allowed if the slot has not yet been booked.
 */
export async function deleteViewingSlot(
  supabase: SupabaseClient,
  slotId: string,
  agentId: string,
): Promise<void> {
  // Fetch current slot to check booked status
  const { data: existing, error: fetchError } = await supabase
    .from("agent_viewing_slots")
    .select("is_booked")
    .eq("id", slotId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Viewing slot not found or access denied");
  }

  if (existing.is_booked) {
    throw new Error("Cannot delete a viewing slot that has already been booked");
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

// ============================================================================
// Viewing feedback functions
// ============================================================================

/**
 * Get post-viewing feedback for an agent, with optional property filter.
 * Ordered by created_at DESC.
 */
export async function getViewingFeedback(
  supabase: SupabaseClient,
  agentId: string,
  propertyId?: string,
): Promise<AgentViewingFeedback[]> {
  let query = supabase
    .from("agent_viewing_feedback")
    .select("*, agent_viewing_slots!inner(property_id)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (propertyId) {
    query = query.eq("agent_viewing_slots.property_id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch viewing feedback: ${error.message}`);
  }

  return (data ?? []) as AgentViewingFeedback[];
}

/**
 * Submit post-viewing feedback for a viewing slot.
 */
export async function submitViewingFeedback(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateViewingFeedbackInput,
): Promise<AgentViewingFeedback> {
  const { data, error } = await supabase
    .from("agent_viewing_feedback")
    .insert({
      agent_id: agentId,
      viewing_slot_id: input.viewing_slot_id,
      buyer_name: input.buyer_name ?? null,
      interest_level: input.interest_level ?? null,
      price_opinion: input.price_opinion ?? null,
      likelihood_to_offer: input.likelihood_to_offer ?? null,
      comments: input.comments ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit viewing feedback: ${error.message}`);
  }

  return data as AgentViewingFeedback;
}
