/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentPerformanceReport,
  getBranchPerformanceReport,
  getCompetitorAnalysis,
  getMarketAppraisalData,
} from "@/services/agent/agent-analytics-service";

/**
 * GET /api/agent/analytics
 * Query params:
 *   ?type=agent                  — agent-level performance report
 *   ?type=branch&branch_id=xxx   — branch-level performance report
 *   ?type=competitor&area=xxx    — competitor analysis for area
 *   ?type=appraisal&postcode=xxx — market appraisal for postcode
 *   Optional: &start=ISO&end=ISO for date range (agent/branch)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") ?? "agent";

    if (type === "branch") {
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

    if (type === "competitor") {
      const area = searchParams.get("area");
      if (!area) {
        return NextResponse.json(
          { error: "area is required for type=competitor" },
          { status: 400 },
        );
      }
      const analysis = await getCompetitorAnalysis(supabase, user.id, area);
      return NextResponse.json(analysis);
    }

    if (type === "appraisal") {
      const postcode = searchParams.get("postcode");
      if (!postcode) {
        return NextResponse.json(
          { error: "postcode is required for type=appraisal" },
          { status: 400 },
        );
      }
      const appraisal = await getMarketAppraisalData(supabase, postcode);
      return NextResponse.json(appraisal);
    }

    // Default: agent performance report
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;
    const dateRange =
      start && end ? { start, end } : undefined;

    const report = await getAgentPerformanceReport(
      supabase,
      user.id,
      dateRange,
    );
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
