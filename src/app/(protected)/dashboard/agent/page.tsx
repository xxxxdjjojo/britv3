import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardKpis, getAgentActivityFeed } from "@/services/agent/agent-dashboard-service";
import { AgentDashboardHome } from "@/components/dashboard/agent/AgentDashboardHome";

export default async function AgentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let kpis;
  try {
    kpis = await getAgentDashboardKpis(supabase, user.id);
  } catch {
    kpis = {
      active_listings_count: 0,
      new_leads_count: 0,
      viewings_this_week_count: 0,
      pending_offers_count: 0,
      performance_score: 0,
    };
  }

  let activityFeed;
  try {
    activityFeed = await getAgentActivityFeed(supabase, user.id);
  } catch {
    activityFeed = [];
  }

  return (
    <AgentDashboardHome kpis={kpis} activityFeed={activityFeed} />
  );
}
