/**
 * Agent dashboard service -- fetches KPI data, activity feed, and performance
 * score for the estate agent dashboard overview.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentDashboardKpis, ActivityFeedItem, DiaryViewingSlot } from "@/types/agent";

/**
 * Calls the get_agent_dashboard_kpis RPC to retrieve all dashboard KPIs in
 * a single round-trip.
 */
export async function getAgentDashboardKpis(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentDashboardKpis> {
  const { data, error } = await supabase.rpc("get_agent_dashboard_kpis", {
    p_agent_id: agentId,
  });
  if (error) throw error;
  return data[0] as AgentDashboardKpis;
}

/**
 * Fetches the latest activity feed items for a given agent by joining
 * agent_lead_activities with agent_leads.
 */
export async function getAgentActivityFeed(
  supabase: SupabaseClient,
  agentId: string,
  limit = 20,
): Promise<ActivityFeedItem[]> {
  const { data, error } = await supabase
    .from("agent_lead_activities")
    .select(
      `
      id,
      activity_type,
      description,
      actor_id,
      created_at,
      metadata,
      agent_leads!inner(agent_id)
    `,
    )
    .eq("agent_leads.agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.activity_type as string,
    description: row.description as string | null,
    actor_id: row.actor_id as string,
    created_at: row.created_at as string,
    metadata: row.metadata as Record<string, unknown> | null,
  }));
}

/**
 * Computes a simple performance score (0–1) based on the ratio of closed
 * leads to total leads for the given agent.
 */
export async function getAgentPerformanceScore(
  supabase: SupabaseClient,
  agentId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("agent_leads")
    .select("stage")
    .eq("agent_id", agentId);

  if (error) throw error;

  const leads = data ?? [];
  if (leads.length === 0) return 0;

  const closed = leads.filter((l) => l.stage === "closed").length;
  return closed / leads.length;
}

/**
 * Fetches today's viewing diary for the given agent.
 */
export async function getTodaysDiary(
  supabase: SupabaseClient,
  agentId: string,
): Promise<DiaryViewingSlot[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("agent_viewing_slots")
    .select("id, property_id, start_time, end_time, is_booked, booked_by, notes")
    .eq("agent_id", agentId)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DiaryViewingSlot[];
}
