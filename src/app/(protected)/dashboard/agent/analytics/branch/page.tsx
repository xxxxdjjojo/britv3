import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentPerformanceReport,
  getBranchPerformanceReport,
} from "@/services/agent/agent-analytics-service";
import { getTeamMembers, getBranches } from "@/services/agent/agent-team-service";
import { BranchPerformanceCharts } from "@/components/dashboard/agent/analytics/BranchPerformanceCharts";
import type { PerformanceReport } from "@/services/agent/agent-analytics-service";
import type { AgentBranch, AgentTeamMember } from "@/types/agent";

export default async function BranchAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let branches: AgentBranch[] = [];
  let teamMembers: AgentTeamMember[] = [];
  let branchReport: PerformanceReport = {
    listings_sold_count: 0,
    avg_time_on_market_days: 0,
    total_revenue: 0,
    conversion_rate: 0,
    client_satisfaction: 0,
    listings_sold_per_month: [],
    revenue_per_month: [],
  };
  let agencyAvg: PerformanceReport = { ...branchReport };

  try {
    branches = await getBranches(supabase, user.id);
  } catch {
    // Fall through with empty branches
  }

  const firstBranchId = branches[0]?.id ?? "";

  try {
    if (firstBranchId) {
      [branchReport, teamMembers] = await Promise.all([
        getBranchPerformanceReport(supabase, user.id, firstBranchId),
        getTeamMembers(supabase, user.id, firstBranchId),
      ]);
    }
    agencyAvg = await getAgentPerformanceReport(supabase, user.id);
  } catch {
    // Fall through with zero values
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branch Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Branch-level performance and team comparison metrics.
        </p>
      </div>

      <div className="flex gap-4 border-b pb-4">
        <a
          href="/dashboard/agent/analytics"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          My Performance
        </a>
        <a
          href="/dashboard/agent/analytics/branch"
          className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1"
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

      {branches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No branches found.{" "}
            <a href="/dashboard/agent/team/branches" className="text-blue-600 hover:underline">
              Create a branch
            </a>{" "}
            to view branch analytics.
          </p>
        </div>
      ) : (
        <BranchPerformanceCharts
          branches={branches}
          initialBranchId={firstBranchId}
          initialReport={branchReport}
          teamMembers={teamMembers}
          agencyAvg={agencyAvg}
        />
      )}
    </div>
  );
}
