import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentPerformanceReport } from "@/services/agent/agent-analytics-service";
import { AgentPerformanceCharts } from "@/components/dashboard/agent/analytics/AgentPerformanceCharts";

export default async function AgentAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let report;
  try {
    report = await getAgentPerformanceReport(supabase, user.id);
  } catch {
    report = {
      listings_sold: 0,
      avg_time_on_market_days: 0,
      total_revenue: 0,
      conversion_rate: 0,
      avg_rating: 0,
    };
  }

  return <AgentPerformanceCharts initialReport={report} />;
}
