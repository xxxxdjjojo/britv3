/**
 * /api/agent/reports
 *
 * POST -- generate a vendor report for a property.
 * GET  -- list vendor reports for the agent.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportType } from "@/types/agent";
import { REPORT_TYPES } from "@/types/agent";
import { generateVendorReport } from "@/services/agent/agent-analytics-service";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("agent_vendor_reports")
      .select("*")
      .eq("agent_id", user.id)
      .order("generated_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      property_id?: string;
      report_type?: string;
    };

    if (!body.property_id) {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 },
      );
    }

    if (
      !body.report_type ||
      !REPORT_TYPES.includes(body.report_type as ReportType)
    ) {
      return NextResponse.json(
        { error: `report_type must be one of: ${REPORT_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const report = await generateVendorReport(
      supabase,
      user.id,
      body.property_id,
      body.report_type as ReportType,
    );
    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
