/**
 * Agent dashboard service -- KPIs, activity feed, and performance score.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentDashboardKpis } from "@/types/agent";

// -- Activity feed item shape -------------------------------------------------

export type ActivityFeedItem = Readonly<{
  id: string;
  type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}>;

// -- Performance score shape --------------------------------------------------

export type PerformanceScore = Readonly<{
  score: number;
  total_leads: number;
  closed_leads: number;
}>;

// -- Service functions --------------------------------------------------------

/**
 * Fetch pre-computed KPIs from the `get_agent_dashboard_kpis` RPC.
 */
export async function getAgentDashboardKpis(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentDashboardKpis> {
  const { data, error } = await supabase
    .rpc("get_agent_dashboard_kpis", { p_agent_id: agentId })
    .single();

  if (error) {
    throw new Error(`Failed to fetch dashboard KPIs: ${error.message}`);
  }

  return data as AgentDashboardKpis;
}

/**
 * Build a combined activity feed from platform_events and
 * agent_lead_activities for the given agent.
 */
export async function getAgentActivityFeed(
  supabase: SupabaseClient,
  agentId: string,
  limit = 20,
): Promise<ActivityFeedItem[]> {
  // Fetch platform events for this agent
  const { data: platformEvents, error: peError } = await supabase
    .from("platform_events")
    .select("id, event_type, description, metadata, created_at")
    .eq("actor_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (peError) {
    throw new Error(`Failed to fetch platform events: ${peError.message}`);
  }

  // Fetch lead activities where the lead belongs to this agent
  const { data: leadActivities, error: laError } = await supabase
    .from("agent_lead_activities")
    .select("id, activity_type, description, metadata, created_at, lead_id")
    .eq("actor_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (laError) {
    throw new Error(`Failed to fetch lead activities: ${laError.message}`);
  }

  // Normalise both sets into a common shape
  const normalisedPlatform: ActivityFeedItem[] = (platformEvents ?? []).map(
    (e: Record<string, unknown>) => ({
      id: e.id as string,
      type: e.event_type as string,
      description: (e.description as string) ?? null,
      metadata: (e.metadata as Record<string, unknown>) ?? {},
      created_at: e.created_at as string,
    }),
  );

  const normalisedLead: ActivityFeedItem[] = (leadActivities ?? []).map(
    (a: Record<string, unknown>) => ({
      id: a.id as string,
      type: a.activity_type as string,
      description: (a.description as string) ?? null,
      metadata: {
        ...((a.metadata as Record<string, unknown>) ?? {}),
        lead_id: a.lead_id as string,
      },
      created_at: a.created_at as string,
    }),
  );

  // Merge, sort desc, and trim to requested limit
  return [...normalisedPlatform, ...normalisedLead]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, limit);
}

/**
 * Compute a simple performance score based on the ratio of closed leads to
 * total leads.
 */
export async function getAgentPerformanceScore(
  supabase: SupabaseClient,
  agentId: string,
): Promise<PerformanceScore> {
  const { data: allLeads, error: allErr } = await supabase
    .from("agent_leads")
    .select("id, stage")
    .eq("agent_id", agentId);

  if (allErr) {
    throw new Error(
      `Failed to compute performance score: ${allErr.message}`,
    );
  }

  const leads = allLeads ?? [];
  const totalLeads = leads.length;
  const closedLeads = leads.filter(
    (l: Record<string, unknown>) => l.stage === "closed",
  ).length;
  const score = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  return { score, total_leads: totalLeads, closed_leads: closedLeads };
}
