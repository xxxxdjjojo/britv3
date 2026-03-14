import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { financialEntrySchema } from "@/types/landlord";
import type { FinancialEntry } from "@/types/landlord";

/**
 * GET /api/landlord/finance/entries
 *
 * Returns all financial_entries across all landlord properties.
 *
 * Query params:
 * - type: "income" | "expense"
 * - category: string
 * - property_id: string
 * - start_date, end_date: YYYY-MM-DD date range
 * - year: number (calendar year filter, shorthand for Jan–Dec)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const propertyId = searchParams.get("property_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const year = searchParams.get("year");

    let query = supabase
      .from("financial_entries")
      .select("*, properties!inner(address_line_1, city, postcode)")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (type === "income" || type === "expense") {
      query = query.eq("type", type);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }
    if (startDate) {
      query = query.gte("entry_date", startDate);
    }
    if (endDate) {
      query = query.lte("entry_date", endDate);
    }
    if (year && !startDate && !endDate) {
      query = query
        .gte("entry_date", `${year}-01-01`)
        .lte("entry_date", `${year}-12-31`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/landlord/finance/entries
 * Create a new financial entry.
 * Body must include: property_id, type, category, amount, entry_date.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { property_id, tenancy_id, ...rest } = body as Record<string, unknown>;

    if (!property_id || typeof property_id !== "string") {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 },
      );
    }

    // Validate with Zod schema
    const parsed = financialEntrySchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation error" },
        { status: 400 },
      );
    }

    const insertData: Record<string, unknown> = {
      property_id,
      user_id: user.id,
      type: parsed.data.type,
      category: parsed.data.category,
      amount: parsed.data.amount,
      entry_date: parsed.data.entry_date,
      description: parsed.data.description || null,
    };

    if (
      parsed.data.type === "income" &&
      parsed.data.category === "rent" &&
      tenancy_id
    ) {
      insertData.tenancy_id = tenancy_id;
    }
    if (parsed.data.rent_period_start) {
      insertData.rent_period_start = parsed.data.rent_period_start;
    }
    if (parsed.data.rent_period_end) {
      insertData.rent_period_end = parsed.data.rent_period_end;
    }

    const { data: record, error } = await supabase
      .from("financial_entries")
      .insert(insertData)
      .select()
      .single();

    if (error || !record) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create entry" },
        { status: 500 },
      );
    }

    return NextResponse.json(record as FinancialEntry, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
