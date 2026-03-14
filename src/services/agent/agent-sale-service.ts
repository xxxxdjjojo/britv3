/**
 * Agent sale progression service — manages the 8-stage UK conveyancing pipeline.
 * Enforces sequential forward and one-step-back transitions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";

// ============================================================================
// Allowed stage transitions
// ============================================================================

/**
 * Maps each stage to its allowed next stages.
 * A stage can move forward one step or backward one step.
 * Skipping stages is not permitted.
 */
const ALLOWED_TRANSITIONS: Record<SaleStage, SaleStage[]> = {
  offer_accepted: ["memorandum_of_sale"],
  memorandum_of_sale: ["offer_accepted", "solicitors_instructed"],
  solicitors_instructed: ["memorandum_of_sale", "searches"],
  searches: ["solicitors_instructed", "survey"],
  survey: ["searches", "mortgage"],
  mortgage: ["survey", "exchange"],
  exchange: ["mortgage", "completion"],
  completion: ["exchange"],
};

// ============================================================================
// Sale progression functions
// ============================================================================

/**
 * Get all active sale progressions for an agent.
 * Includes property and offer details for the Kanban board.
 * Ordered by updated_at DESC.
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
 * Create a new sale progression record at the 'offer_accepted' stage.
 * Called automatically when an offer is accepted.
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
      stage: SALE_STAGES[0], // 'offer_accepted'
      solicitor_buyer: {},
      solicitor_seller: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sale progression: ${error.message}`);
  }

  return data as AgentSaleProgression;
}

/**
 * Update the stage of a sale progression.
 * Validates the transition against ALLOWED_TRANSITIONS — throws if invalid.
 * Optional notes field updated alongside stage.
 */
export async function updateSaleStage(
  supabase: SupabaseClient,
  progressionId: string,
  agentId: string,
  newStage: SaleStage,
  notes?: string,
): Promise<AgentSaleProgression> {
  // Fetch current progression to validate transition
  const { data: existing, error: fetchError } = await supabase
    .from("agent_sale_progressions")
    .select("stage")
    .eq("id", progressionId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Sale progression not found or access denied");
  }

  const currentStage = existing.stage as SaleStage;
  const allowedNext = ALLOWED_TRANSITIONS[currentStage];

  if (!allowedNext.includes(newStage)) {
    throw new Error(
      `Invalid stage transition: '${currentStage}' → '${newStage}'. ` +
        `Allowed transitions: ${allowedNext.join(", ")}`,
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
 * Get a single sale progression by ID with offer and property details.
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
    throw new Error("Sale progression not found or access denied");
  }

  return data as AgentSaleProgression;
}
