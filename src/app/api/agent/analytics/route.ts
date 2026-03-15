import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentPerformanceReport,
  getBranchPerformanceReport,
  getCompetitorAnalysis,
  getMarketAppraisalData,
} from "@/services/agent/agent-analytics-service";

/**
 * GET /api/agent/analytics
 *
 * Routes analytics requests by ?type= query param:
 *   - type=agent            -> agent-level performance report
 *   - type=branch&branch_id -> branch-scoped performance report
 *   - type=competitor&area  -> competitor analysis for an area
 *   - type=appraisal&postcode -> market appraisal data
 *
 * Optional date filtering: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const dateRange =
    from && to ? { from, to } : undefined;

  try {
    switch (type) {
      case "agent": {
        const report = await getAgentPerformanceReport(
          supabase,
          user.id,
          dateRange,
        );
        return NextResponse.json(report);
      }

      case "branch": {
        const branchId = searchParams.get("branch_id");
        if (!branchId) {
          return NextResponse.json(
            { error: "branch_id is required for type=branch" },
            { status: 400 },
          );
        }
        const report = await getBranchPerformanceReport(
          supabase,
          user.id,
          branchId,
        );
        return NextResponse.json(report);
      }

      case "competitor": {
        const area = searchParams.get("area");
        if (!area) {
          return NextResponse.json(
            { error: "area is required for type=competitor" },
            { status: 400 },
          );
        }
        const data = await getCompetitorAnalysis(supabase, user.id, area);
        return NextResponse.json(data);
      }

      case "appraisal": {
        const postcode = searchParams.get("postcode");
        if (!postcode) {
          return NextResponse.json(
            { error: "postcode is required for type=appraisal" },
            { status: 400 },
          );
        }
        const data = await getMarketAppraisalData(supabase, postcode);
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          {
            error:
              "type is required. Valid values: agent | branch | competitor | appraisal",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
