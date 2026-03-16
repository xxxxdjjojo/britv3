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

// -- Activity chart point shape -----------------------------------------------

export type ActivityChartPoint = Readonly<{
  /** Short date label, e.g. "12 Mar" */
  date: string;
  listings: number;
  leads: number;
  viewings: number;
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
 * Return 30-day bucketed activity counts for the dashboard chart.
 *
 * Queries agent_lead_activities and platform_events for the last 30 days,
 * groups by calendar day (UTC), and classifies each row into one of three
 * buckets: listings, leads, or viewings. Days with no activity are included
 * with zero counts so the chart x-axis stays consistent.
 */
export async function getAgentActivityChartData(
  supabase: SupabaseClient,
  agentId: string,
): Promise<ActivityChartPoint[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29); // last 30 days inclusive
  since.setUTCHours(0, 0, 0, 0);

  // Build a full 30-day scaffold keyed by ISO date string (YYYY-MM-DD).
  const scaffold = new Map<string, { listings: number; leads: number; viewings: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    scaffold.set(d.toISOString().slice(0, 10), { listings: 0, leads: 0, viewings: 0 });
  }

  // Fetch lead activities (leads + viewings bucket).
  const { data: leadActivities } = await supabase
    .from("agent_lead_activities")
    .select("activity_type, created_at")
    .eq("actor_id", agentId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  for (const row of leadActivities ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    const bucket = scaffold.get(day);
    if (!bucket) continue;
    const type = row.activity_type as string;
    if (type.startsWith("viewing")) {
      bucket.viewings += 1;
    } else {
      bucket.leads += 1;
    }
  }

  // Fetch platform events (listings bucket).
  const { data: platformEvents } = await supabase
    .from("platform_events")
    .select("event_type, created_at")
    .eq("actor_id", agentId)
    .ilike("event_type", "listing%")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  for (const row of platformEvents ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    const bucket = scaffold.get(day);
    if (!bucket) continue;
    bucket.listings += 1;
  }

  // Convert scaffold to sorted array with display label.
  return Array.from(scaffold.entries()).map(([isoDate, counts]) => {
    const d = new Date(isoDate + "T00:00:00Z");
    const label = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return { date: label, ...counts };
  });
}

// -- Lead source shape --------------------------------------------------------

export type LeadSourcePoint = Readonly<{
  /** Lead acquisition channel, e.g. "portal", "referral", "walk_in" */
  source: string;
  count: number;
}>;

// -- Lead source query --------------------------------------------------------

/**
 * Return a count breakdown of `agent_leads` grouped by their `source` column
 * for the given agent. Results are sorted descending by count.
 */
export async function getAgentLeadSources(
  supabase: SupabaseClient,
  agentId: string,
): Promise<LeadSourcePoint[]> {
  const { data, error } = await supabase
    .from("agent_leads")
    .select("source")
    .eq("agent_id", agentId);

  if (error) {
    throw new Error(`Failed to fetch lead sources: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const src = (row.source as string) ?? "unknown";
    counts.set(src, (counts.get(src) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
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
