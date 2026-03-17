/**
 * Agent Sale Progression Service — manage sale pipeline stages.
 * Enforces allowed stage transitions to maintain data integrity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";

// Allowed stage transitions for sale progression
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

/**
 * Get all sale progressions for an agent.
 */
export async function getAgentSaleProgressions(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentSaleProgression[]> {
  const { data, error } = await supabase
    .from("agent_sale_progressions")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch sale progressions: ${error.message}`);
  }

  return (data ?? []) as AgentSaleProgression[];
}

/**
 * Create a new sale progression when an offer is accepted.
 * Initial stage is always 'offer_accepted'.
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
      stage: "offer_accepted" satisfies SaleStage,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create sale progression: ${error?.message ?? "no data"}`,
    );
  }

  return data as AgentSaleProgression;
}

/**
 * Advance (or revert) a sale to a new stage.
 * Only transitions listed in ALLOWED_TRANSITIONS are permitted.
 */
export async function updateSaleStage(
  supabase: SupabaseClient,
  progressionId: string,
  agentId: string,
  newStage: SaleStage,
  notes?: string,
): Promise<AgentSaleProgression> {
  const { data: existing, error: fetchError } = await supabase
    .from("agent_sale_progressions")
    .select("stage")
    .eq("id", progressionId)
    .eq("agent_id", agentId)
    .single();

  if (fetchError || !existing) {
    throw new Error(
      `Sale progression not found: ${fetchError?.message ?? "no data"}`,
    );
  }

  const currentStage = existing.stage as SaleStage;
  const allowedNext = ALLOWED_TRANSITIONS[currentStage];

  if (!allowedNext.includes(newStage)) {
    throw new Error(
      `Invalid stage transition from '${currentStage}' to '${newStage}'. Allowed: ${allowedNext.join(", ")}`,
    );
  }

  const updatePayload: { stage: SaleStage; notes?: string; updated_at: string } = {
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

  if (error || !data) {
    throw new Error(
      `Failed to update sale stage: ${error?.message ?? "no data"}`,
    );
  }

  return data as AgentSaleProgression;
}

/**
 * Get a single sale progression by ID.
 */
export async function getSaleProgressionById(
  supabase: SupabaseClient,
  progressionId: string,
  agentId: string,
): Promise<AgentSaleProgression | null> {
  const { data, error } = await supabase
    .from("agent_sale_progressions")
    .select("*")
    .eq("id", progressionId)
    .eq("agent_id", agentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch sale progression: ${error.message}`);
  }

  return (data ?? null) as AgentSaleProgression | null;
}
