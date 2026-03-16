import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/provider/availability?year=YYYY&month=MM
 *  Returns provider_availability rows covering the requested month window.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Resolve provider id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  // Default: current month + 2 months ahead
  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

  // Window: first day of requested month → last day 2 months later
  const windowStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const endYear = month + 2 > 12 ? year + 1 : year;
  const endMonth = ((month + 1) % 12) + 1; // last day of month+2
  const endMonthFor3rd = month + 2 > 12 ? (month + 2) - 12 : month + 2;
  const lastDayOf3rdMonth = new Date(
    endMonth + 1 > 12 ? endYear + 1 : endYear,
    endMonthFor3rd,
    0,
  );
  const windowEnd = lastDayOf3rdMonth.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("provider_availability")
    .select("id, provider_id, start_date, end_date, reason")
    .eq("provider_id", providerId)
    .lte("start_date", windowEnd)
    .gte("end_date", windowStart)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/** POST /api/provider/availability
 *  Body: { date: "YYYY-MM-DD", is_available: boolean, reason?: string }
 *
 *  is_available=false  → insert a single-day blocked range
 *  is_available=true   → delete any availability row whose range is exactly that day
 *                        (simple single-day toggle; range rows from legacy API are untouched)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  let body: { date?: string; is_available?: boolean; reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, is_available, reason } = body;

  if (!date || typeof is_available !== "boolean") {
    return NextResponse.json(
      { error: "date and is_available are required" },
      { status: 400 },
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  if (is_available) {
    // Un-block: delete single-day rows matching this provider + date exactly
    const { error } = await supabase
      .from("provider_availability")
      .delete()
      .eq("provider_id", providerId)
      .eq("start_date", date)
      .eq("end_date", date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { date, is_available: true } });
  } else {
    // Block: upsert a single-day unavailability row
    // We use insert with onConflict do-nothing to be idempotent; there's no unique
    // constraint on (provider_id, start_date, end_date) so we check first.
    const { data: existing } = await supabase
      .from("provider_availability")
      .select("id")
      .eq("provider_id", providerId)
      .eq("start_date", date)
      .eq("end_date", date)
      .maybeSingle();

    if (existing) {
      // Already blocked — update reason if provided
      if (reason !== undefined) {
        await supabase
          .from("provider_availability")
          .update({ reason: reason ?? null })
          .eq("id", existing.id);
      }
      return NextResponse.json({ data: { date, is_available: false } });
    }

    const { error } = await supabase.from("provider_availability").insert({
      provider_id: providerId,
      start_date: date,
      end_date: date,
      reason: reason ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: { date, is_available: false } },
      { status: 201 },
    );
  }
}
