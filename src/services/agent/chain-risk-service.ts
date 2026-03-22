/**
 * Chain Risk Service — manage chain links and risk scores for sale progressions.
 * Uses SupabaseClient injection following the agent-sale-service pattern.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChainLink,
  ChainRiskScore,
  ChainDetail,
  ChainMember,
  SaleStage,
  ChainRiskLevel,
} from "@/types/agent";
import { computeChainRiskScore } from "@/services/agent/chain-risk-scoring";

/**
 * Get all chain links where the given progression is upstream or downstream.
 */
export async function getChainLinksForProgression(
  supabase: SupabaseClient,
  progressionId: string,
): Promise<ChainLink[]> {
  const { data, error } = await supabase
    .from("chain_links")
    .select("*")
    .or(`upstream_progression_id.eq.${progressionId},downstream_progression_id.eq.${progressionId}`);

  if (error) {
    throw new Error(`Failed to fetch chain links: ${error.message}`);
  }

  return (data ?? []) as ChainLink[];
}

/**
 * Create a new chain link between two sale progressions.
 */
export async function createChainLink(
  supabase: SupabaseClient,
  upstreamId: string,
  downstreamId: string,
  chainGroupId: string,
  position: number,
): Promise<ChainLink> {
  const { data, error } = await supabase
    .from("chain_links")
    .insert({
      upstream_progression_id: upstreamId,
      downstream_progression_id: downstreamId,
      chain_group_id: chainGroupId,
      position_in_chain: position,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create chain link: ${error?.message ?? "no data"}`,
    );
  }

  return data as ChainLink;
}

/**
 * Delete a chain link by ID.
 */
export async function deleteChainLink(
  supabase: SupabaseClient,
  linkId: string,
): Promise<void> {
  const { error } = await supabase
    .from("chain_links")
    .delete()
    .eq("id", linkId);

  if (error) {
    throw new Error(`Failed to delete chain link: ${error.message}`);
  }
}

/**
 * Get all chain risk scores for an agent, keyed by progression_id.
 */
export async function getRiskScoresForAgent(
  supabase: SupabaseClient,
  agentId: string,
): Promise<Map<string, ChainRiskScore>> {
  const { data, error } = await supabase
    .from("chain_risk_scores")
    .select("*, agent_sale_progressions!inner(agent_id)")
    .eq("agent_sale_progressions.agent_id", agentId);

  if (error) {
    throw new Error(`Failed to fetch risk scores: ${error.message}`);
  }

  const map = new Map<string, ChainRiskScore>();
  for (const row of data ?? []) {
    // Strip the join field before casting
    const { agent_sale_progressions: _, ...score } = row as Record<string, unknown>;
    map.set(score.progression_id as string, score as unknown as ChainRiskScore);
  }

  return map;
}

/**
 * Get full chain detail for visualization, given a chain_group_id.
 */
export async function getChainDetail(
  supabase: SupabaseClient,
  chainGroupId: string,
  currentAgentId: string,
): Promise<ChainDetail> {
  // Fetch all links in this chain group
  const { data: links, error: linksError } = await supabase
    .from("chain_links")
    .select("upstream_progression_id, downstream_progression_id, position_in_chain")
    .eq("chain_group_id", chainGroupId);

  if (linksError) {
    throw new Error(`Failed to fetch chain links: ${linksError.message}`);
  }

  if (!links || links.length === 0) {
    throw new Error("No chain links found for this group");
  }

  // Collect unique progression IDs
  const progressionIds = new Set<string>();
  for (const link of links) {
    progressionIds.add(link.upstream_progression_id as string);
    progressionIds.add(link.downstream_progression_id as string);
  }

  // Fetch all member progressions
  const { data: progressions, error: progError } = await supabase
    .from("agent_sale_progressions")
    .select("id, property_id, stage, updated_at, agent_id")
    .in("id", [...progressionIds]);

  if (progError) {
    throw new Error(`Failed to fetch progressions: ${progError.message}`);
  }

  if (!progressions || progressions.length === 0) {
    throw new Error("No progressions found for chain members");
  }

  // Build members with computed days_in_stage and position
  const members: ChainMember[] = progressions.map((p) => {
    const daysInStage = Math.floor(
      (Date.now() - new Date(p.updated_at as string).getTime()) / (1000 * 60 * 60 * 24),
    );

    // Determine position from links
    let position = 1;
    for (const link of links) {
      if (link.downstream_progression_id === p.id) {
        position = Math.max(position, (link.position_in_chain as number) + 1);
      }
      if (link.upstream_progression_id === p.id) {
        position = Math.max(position, link.position_in_chain as number);
      }
    }

    return {
      progression_id: p.id as string,
      property_id: p.property_id as string,
      stage: p.stage as SaleStage,
      updated_at: p.updated_at as string,
      days_in_stage: daysInStage,
      position,
      agent_id: p.agent_id as string,
      is_own: (p.agent_id as string) === currentAgentId,
    };
  });

  // Compute overall risk
  const scoringMembers = members.map((m) => ({
    id: m.progression_id,
    stage: m.stage,
    days_in_stage: m.days_in_stage,
    updated_at: m.updated_at,
  }));

  const riskResult = computeChainRiskScore(scoringMembers, members[0].progression_id, 1);

  // Find slowest member
  let slowestMember: ChainMember | null = null;
  let maxDays = 0;
  for (const m of members) {
    if (m.days_in_stage > maxDays) {
      maxDays = m.days_in_stage;
      slowestMember = m;
    }
  }

  return {
    chain_group_id: chainGroupId,
    members,
    total_length: members.length,
    risk_level: riskResult.risk_level as ChainRiskLevel,
    risk_score: riskResult.risk_score,
    slowest_member: slowestMember,
  };
}
