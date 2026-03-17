import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/reviews/aggregate
 * Returns aggregated review stats by area and/or trade category.
 * Public endpoint — no auth required.
 *
 * Query params:
 *   area (optional) — postcode district e.g. "TW7", "SW1"
 *   category (optional) — trade category e.g. "plumber", "electrician"
 *   limit (optional, default 20) — max results
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  try {
    const supabase = await createClient();

    let query = supabase
      .from("area_rating_stats")
      .select("*")
      .order("total_reviews", { ascending: false })
      .limit(limit);

    if (area) {
      query = query.eq("area_code", area.toUpperCase());
    }
    if (category) {
      query = query.eq("trade_category", category.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch aggregate stats: ${error.message}`);
    }

    return NextResponse.json({
      data: data ?? [],
      meta: { area, category, count: data?.length ?? 0 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch aggregate reviews";
    console.error("[api/reviews/aggregate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
