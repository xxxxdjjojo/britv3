import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardKpis, getAgentActivityFeed } from "@/services/agent/agent-dashboard-service";
import { AgentDashboardHome } from "@/components/dashboard/agent/AgentDashboardHome";

export default async function AgentDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let kpis = {
    active_listings_count: 0,
    new_leads_count: 0,
    viewings_this_week_count: 0,
    pending_offers_count: 0,
    performance_score: 0,
  };

  let activityFeed: Awaited<ReturnType<typeof getAgentActivityFeed>> = [];

  try {
    kpis = await getAgentDashboardKpis(supabase, user.id);
  } catch {
    // RPC may not exist yet in all envs — fall back to zeros
  }

  try {
    activityFeed = await getAgentActivityFeed(supabase, user.id, 20);
  } catch {
    // Activity feed table may be empty — fail gracefully
  }

  return (
    <AgentDashboardHome
      kpis={kpis}
      activityFeed={activityFeed}
      agentName={user.email ?? "Agent"}
    />
  );
}
