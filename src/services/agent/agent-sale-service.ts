/**
 * Agent sale progression service -- tracks the lifecycle of a property sale
 * from accepted offer through to completion.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";

// -- Allowed stage transitions ------------------------------------------------

/**
 * Each stage can move forward to the next stage or rollback to the previous.
 * 'completion' can only roll back to 'exchange'.
 */
export const ALLOWED_TRANSITIONS: Record<SaleStage, SaleStage[]> = {
  offer_accepted: ["memorandum_of_sale"],
  memorandum_of_sale: ["offer_accepted", "solicitors_instructed"],
  solicitors_instructed: ["memorandum_of_sale", "searches"],
  searches: ["solicitors_instructed", "survey"],
  survey: ["searches", "mortgage"],
  mortgage: ["survey", "exchange"],
  exchange: ["mortgage", "completion"],
  completion: ["exchange"],
};

// -- Service functions --------------------------------------------------------

/**
 * List all sale progressions for an agent, ordered by most recently updated.
 */
export async function getAgentSaleProgressions(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentSaleProgression[]> {
  const { data, error } = await supabase
    .from("agent_sale_progressions")
    .select("*")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch sale progressions: ${error.message}`);
  }

  return (data ?? []) as AgentSaleProgression[];
}

/**
 * Create a new sale progression when an offer is accepted.
 * Starts at stage 'offer_accepted'.
 */
export async function createSaleProgression(
  supabase: SupabaseClient,
  agentId: string,
  offerId: string,
  propertyId: string,
): Promise<AgentSaleProgression> {
  const { data, error } = await supabase
    .from("agent_sale_progressions")
    .insert({
      agent_id: agentId,
      offer_id: offerId,
      property_id: propertyId,
      stage: "offer_accepted" as SaleStage,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sale progression: ${error.message}`);
  }

  return data as AgentSaleProgression;
}

/**
 * Move a sale progression to a new stage. Validates that the transition is
 * allowed (forward one step or rollback one step).
 */
export async function updateSaleStage(
  supabase: SupabaseClient,
  progressionId: string,
  agentId: string,
  newStage: SaleStage,
  notes?: string,
): Promise<AgentSaleProgression> {
  // Fetch current stage
  const { data: current, error: fetchErr } = await supabase
    .from("agent_sale_progressions")
    .select("stage")
    .eq("id", progressionId)
    .eq("agent_id", agentId)
    .single();

  if (fetchErr || !current) {
    throw new Error(fetchErr?.message ?? "Sale progression not found");
  }

  const currentStage = (current as Record<string, unknown>).stage as SaleStage;
  const allowed = ALLOWED_TRANSITIONS[currentStage];

  if (!allowed.includes(newStage)) {
    throw new Error(
      `Invalid stage transition from '${currentStage}' to '${newStage}'`,
    );
  }

  const updatePayload: Record<string, unknown> = {
    stage: newStage,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  const { data, error } = await supabase
    .from("agent_sale_progressions")
    .update(updatePayload)
    .eq("id", progressionId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sale stage: ${error.message}`);
  }

  return data as AgentSaleProgression;
}

/**
 * Fetch a single sale progression by ID with ownership check.
 */
export async function getSaleProgressionById(
  supabase: SupabaseClient,
  progressionId: string,
  agentId: string,
): Promise<AgentSaleProgression> {
  const { data, error } = await supabase
    .from("agent_sale_progressions")
    .select("*")
    .eq("id", progressionId)
    .eq("agent_id", agentId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Sale progression not found");
  }

  return data as AgentSaleProgression;
}
