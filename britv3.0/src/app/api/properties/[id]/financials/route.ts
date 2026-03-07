import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getFinancialEntries,
  createFinancialEntry,
  getFinancialSummary,
  resolvePeriodPreset,
} from "@/services/landlord/financial-service";
import { FINANCIAL_ENTRY_TYPES } from "@/types/landlord";

/**
 * GET /api/properties/[id]/financials
 *
 * Query params:
 * - type: "income" | "expense" (optional filter)
 * - category: string (optional filter)
 * - start_date, end_date: date range filter (YYYY-MM-DD)
 * - summary_only: "true" to get aggregated summary via RPC
 * - period: "this_month" | "this_quarter" | "ytd" | "last_12_months" (preset for summary)
 */
export async function GET(
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

    const { searchParams } = request.nextUrl;
    const summaryOnly = searchParams.get("summary_only") === "true";

    if (summaryOnly) {
      // Resolve date range from preset or explicit dates
      const period = searchParams.get("period");
      let startDate = searchParams.get("start_date");
      let endDate = searchParams.get("end_date");

      if (period && !startDate) {
        const resolved = resolvePeriodPreset(period);
        startDate = resolved.start;
        endDate = resolved.end;
      }

      if (!startDate || !endDate) {
        // Default to current month
        const resolved = resolvePeriodPreset("this_month");
        startDate = resolved.start;
        endDate = resolved.end;
      }

      const summary = await getFinancialSummary(
        supabase,
        propertyId,
        startDate,
        endDate,
      );

      return NextResponse.json(summary);
    }

    // List mode -- return entries with optional filters
    const type = searchParams.get("type") as "income" | "expense" | null;
    const category = searchParams.get("category");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Validate type if provided
    if (
      type &&
      !FINANCIAL_ENTRY_TYPES.includes(type as (typeof FINANCIAL_ENTRY_TYPES)[number])
    ) {
      return NextResponse.json(
        { error: `Invalid type: ${type}` },
        { status: 400 },
      );
    }

    const entries = await getFinancialEntries(supabase, propertyId, {
      type: type ?? undefined,
      category: category ?? undefined,
      dateRange:
        startDate && endDate ? { start: startDate, end: endDate } : undefined,
    });

    return NextResponse.json(entries);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/properties/[id]/financials
 * Create a new financial entry.
 * Receipt upload is handled separately via client-side Supabase Storage.
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

    const body = await request.json();

    const record = await createFinancialEntry(supabase, propertyId, body);

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("required") || message.includes("positive")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
