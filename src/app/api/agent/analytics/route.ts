/**
 * /api/agent/analytics
 *
 * GET -- analytics reports, routed by ?type= query param:
 *   - agent     → agent performance report
 *   - branch    → branch performance report (requires branch_id)
 *   - competitor → competitor analysis (requires area)
 *   - appraisal → market appraisal (requires postcode)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentPerformanceReport,
  getBranchPerformanceReport,
  getCompetitorAnalysis,
  getMarketAppraisalData,
} from "@/services/agent/agent-analytics-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const type = params.get("type") ?? "agent";

    switch (type) {
      case "agent": {
        const start = params.get("start") ?? undefined;
        const end = params.get("end") ?? undefined;
        const dateRange =
          start && end ? { start, end } : undefined;
        const report = await getAgentPerformanceReport(
          supabase,
          user.id,
          dateRange,
        );
        return NextResponse.json({ report });
      }

      case "branch": {
        const branchId = params.get("branch_id");
        if (!branchId) {
          return NextResponse.json(
            { error: "branch_id is required for branch report" },
            { status: 400 },
          );
        }
        const report = await getBranchPerformanceReport(
          supabase,
          user.id,
          branchId,
        );
        return NextResponse.json({ report });
      }

      case "competitor": {
        const area = params.get("area");
        if (!area) {
          return NextResponse.json(
            { error: "area is required for competitor analysis" },
            { status: 400 },
          );
        }
        const analysis = await getCompetitorAnalysis(supabase, user.id, area);
        return NextResponse.json({ analysis });
      }

      case "appraisal": {
        const postcode = params.get("postcode");
        if (!postcode) {
          return NextResponse.json(
            { error: "postcode is required for market appraisal" },
            { status: 400 },
          );
        }
        const appraisal = await getMarketAppraisalData(supabase, postcode);
        return NextResponse.json({ appraisal });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}` },
          { status: 400 },
        );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
