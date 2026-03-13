import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBranchPerformanceReport } from "@/services/agent/agent-analytics-service";
import { BranchPerformanceCharts } from "@/components/dashboard/agent/analytics/BranchPerformanceCharts";

export default async function BranchAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch branches for dropdown
  let branches: Array<{ id: string; name: string }> = [];
  try {
    const { data } = await supabase
      .from("agent_branches")
      .select("id, name")
      .eq("agent_id", user.id)
      .order("name");
    branches = (data ?? []) as Array<{ id: string; name: string }>;
  } catch {
    branches = [];
  }

  // Fetch performance for first branch if available
  let initialReport = null;
  if (branches.length > 0) {
    try {
      initialReport = await getBranchPerformanceReport(
        supabase,
        user.id,
        branches[0].id,
      );
    } catch {
      initialReport = null;
    }
  }

  return (
    <BranchPerformanceCharts
      branches={branches}
      initialReport={initialReport}
    />
  );
}
