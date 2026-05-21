/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVendorReport } from "@/services/agent/agent-analytics-service";

/**
 * GET /api/agent/reports
 * List vendor reports for the agent.
 * Optional: ?property_id=xxx to filter by property.
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
    const propertyId = searchParams.get("property_id");

    let query = supabase
      .from("agent_vendor_reports")
      .select("*")
      .eq("agent_id", user.id)
      .order("generated_at", { ascending: false });

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data ?? []);
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
 * Generate a new vendor report.
 * Body: { property_id, report_type }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { property_id, report_type } = body;

    if (!property_id || !report_type) {
      return NextResponse.json(
        { error: "property_id and report_type are required" },
        { status: 400 },
      );
    }

    const report = await generateVendorReport(
      supabase,
      user.id,
      property_id,
      report_type,
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
