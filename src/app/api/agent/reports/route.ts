import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportType } from "@/types/agent";
import { REPORT_TYPES } from "@/types/agent";
import {
  generateVendorReport,
  getVendorReports,
} from "@/services/agent/agent-analytics-service";

/**
 * GET /api/agent/reports?propertyId=<id>
 * Returns all vendor reports for the given property, most recent first.
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
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json(
      { error: "propertyId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const reports = await getVendorReports(supabase, user.id, propertyId);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch vendor reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor reports" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/reports
 * Generates a new vendor report for a property.
 * Body: { propertyId: string, reportType: ReportType }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { propertyId, reportType } = body as {
      propertyId?: string;
      reportType?: ReportType;
    };

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 },
      );
    }

    if (!reportType || !(REPORT_TYPES as readonly string[]).includes(reportType)) {
      return NextResponse.json(
        {
          error: `reportType is required. Valid values: ${REPORT_TYPES.join(" | ")}`,
        },
        { status: 400 },
      );
    }

    const report = await generateVendorReport(
      supabase,
      user.id,
      propertyId,
      reportType,
    );

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to generate vendor report:", error);
    return NextResponse.json(
      { error: "Failed to generate vendor report" },
      { status: 500 },
    );
  }
}
