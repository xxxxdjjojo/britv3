import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const REPORT_REASONS = [
  "Incorrect information",
  "Property no longer available",
  "Suspected fraud",
  "Offensive content",
  "Other",
] as const;

const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .max(500, "Details must be 500 characters or fewer.")
    .optional(),
});

/**
 * POST /api/properties/[id]/report
 *
 * Requires authentication. Validates reason via Zod enum.
 * Attempts to insert into property_reports table; falls back to console log
 * if the table does not yet exist (development convenience only).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation error.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { reason, details } = parsed.data;

    // Attempt DB insert; gracefully degrade if table absent
    const { error: dbError } = await supabase.from("property_reports").insert({
      property_id: propertyId,
      reporter_id: user.id,
      reason,
      details: details ?? null,
    });

    if (dbError) {
      // Table likely doesn't exist yet — log and continue (non-blocking)
      if (
        dbError.code === "42P01" || // undefined_table
        dbError.message.includes("does not exist")
      ) {
        console.warn(
          "[report] property_reports table not found — logging report instead:",
          { propertyId, reporterId: user.id, reason, details },
        );
      } else {
        console.error("[report] DB insert error:", dbError);
        return NextResponse.json(
          { error: "Failed to save report. Please try again." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { message: "Report submitted successfully." },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
