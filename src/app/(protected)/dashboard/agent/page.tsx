import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureException } from "@/lib/observability/capture-exception";
import { getAgentDashboardKpis, getAgentActivityFeed, getTodaysDiary } from "@/services/agent/agent-dashboard-service";
import { AgentDashboardHome } from "@/components/dashboard/agent/AgentDashboardHome";
import type { DiaryViewingSlot } from "@/types/agent";
import { AwardStandingPanel } from "./AwardStandingPanel";

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
  let todaysDiary: DiaryViewingSlot[] = [];

  try {
    kpis = await getAgentDashboardKpis(supabase, user.id);
  } catch (error) {
    captureException(error, {
      module: "dashboard",
      feature: "agent",
      route: "/dashboard/agent",
      operation: "getAgentDashboardKpis",
    });
    // RPC may not exist yet in all envs — fall back to zeros
  }

  try {
    activityFeed = await getAgentActivityFeed(supabase, user.id, 20);
  } catch (error) {
    captureException(error, {
      module: "dashboard",
      feature: "agent",
      route: "/dashboard/agent",
      operation: "getAgentActivityFeed",
    });
    // Activity feed table may be empty — fail gracefully
  }

  try {
    todaysDiary = await getTodaysDiary(supabase, user.id);
  } catch (error) {
    captureException(error, {
      module: "dashboard",
      feature: "agent",
      route: "/dashboard/agent",
      operation: "getTodaysDiary",
    });
    // Viewing slots may be empty — fail gracefully
  }

  return (
    <>
      <AgentDashboardHome
        kpis={kpis}
        activityFeed={activityFeed}
        agentName={user.email ?? "Agent"}
        todaysDiary={todaysDiary}
      />
      <section aria-label="Honest Agent Awards standing" className="mt-6">
        <AwardStandingPanel />
      </section>
    </>
  );
}
