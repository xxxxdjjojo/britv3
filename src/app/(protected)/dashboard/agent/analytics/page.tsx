import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentPerformanceReport } from "@/services/agent/agent-analytics-service";
import { AgentPerformanceCharts } from "@/components/dashboard/agent/analytics/AgentPerformanceCharts";

export default async function AgentAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Default to last 12 months
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(now.getFullYear() - 1);

  let report: Awaited<ReturnType<typeof getAgentPerformanceReport>> = {
    listings_sold_count: 0,
    avg_time_on_market_days: 0,
    total_revenue: 0,
    conversion_rate: 0,
    client_satisfaction: 0,
    listings_sold_per_month: [],
    revenue_per_month: [],
  };

  try {
    report = await getAgentPerformanceReport(supabase, user.id, {
      start: from.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    });
  } catch {
    // Render with zero values on error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your sales performance, revenue, and conversion metrics.
        </p>
      </div>

      <div className="flex gap-4 border-b pb-4">
        <a
          href="/dashboard/agent/analytics"
          className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1"
        >
          My Performance
        </a>
        <a
          href="/dashboard/agent/analytics/branch"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Branch Analytics
        </a>
        <a
          href="/dashboard/agent/analytics/competitors"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Competitor Analysis
        </a>
      </div>

      <AgentPerformanceCharts initialReport={report} agentId={user.id} />
    </div>
  );
}
