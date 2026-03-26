import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardKpis, getAgentActivityFeed, getTodaysDiary } from "@/services/agent/agent-dashboard-service";
import { AgentDashboardHome } from "@/components/dashboard/agent/AgentDashboardHome";
import type { DiaryViewingSlot } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
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
  } catch {
    // RPC may not exist yet in all envs — fall back to zeros
  }

  try {
    activityFeed = await getAgentActivityFeed(supabase, user.id, 20);
  } catch {
    // Activity feed table may be empty — fail gracefully
  }

  try {
    todaysDiary = await getTodaysDiary(supabase, user.id);
  } catch {
    // Viewing slots may be empty — fail gracefully
  }

  return (
    <AgentDashboardHome
      kpis={kpis}
      activityFeed={activityFeed}
      agentName={user.email ?? "Agent"}
      todaysDiary={todaysDiary}
    />
  );
}

export default function AgentDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
