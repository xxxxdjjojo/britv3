import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompetitorAnalysis } from "@/services/agent/agent-analytics-service";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { CompetitorAnalysis } from "@/components/dashboard/agent/analytics/CompetitorAnalysis";
import type { CompetitorEntry } from "@/services/agent/agent-analytics-service";

type AreaPriceTrend = {
  month: string;
  avg_price: number;
};

export default async function CompetitorAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch agent's agency profile to get coverage_areas
  const { data: agencyProfile } = await supabase
    .from("agent_agency_profiles")
    .select("coverage_areas")
    .eq("agent_id", user.id)
    .single();

  const coverageAreas: string[] = (agencyProfile as { coverage_areas?: string[] } | null)
    ?.coverage_areas ?? [];
  const primaryArea = coverageAreas[0] ?? "";

  let competitors: CompetitorEntry[] = [];
  let agentListingCount = 0;
  const priceTrend: AreaPriceTrend[] = [];

  try {
    if (primaryArea) {
      competitors = await getCompetitorAnalysis(supabase, user.id, primaryArea);
    }
    const { listings } = await getAgentListings(supabase, user.id, "active");
    agentListingCount = listings.length;
  } catch {
    // Fall through with empty data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Competitor Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          See how you compare to other agencies in your coverage areas.
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
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Branch Analytics
        </a>
        <a
          href="/dashboard/agent/analytics/competitors"
          className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1"
        >
          Competitor Analysis
        </a>
      </div>

      {coverageAreas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No coverage areas set.{" "}
            <a href="/dashboard/agent/profile" className="text-blue-600 hover:underline">
              Update your agency profile
            </a>{" "}
            to add coverage areas for competitor analysis.
          </p>
        </div>
      ) : (
        <CompetitorAnalysis
          coverageAreas={coverageAreas}
          initialArea={primaryArea}
          competitors={competitors}
          agentListingCount={agentListingCount}
          priceTrend={priceTrend}
        />
      )}
    </div>
  );
}
