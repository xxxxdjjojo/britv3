/**
 * API route for service provider directory.
 * GET /api/services?category=mortgage_broker|conveyancing|surveying&postcode=SW1A1AA
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_CATEGORIES = ["mortgage_broker", "conveyancing", "surveying"] as const;
type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];

export type ProviderResult = {
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  slug: string | null;
  services: string[] | null;
  service_postcodes: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  completed_jobs_count: number | null;
  response_time_hours: number | null;
  years_in_business: number | null;
};

/**
 * GET /api/services - Search service providers by category and postcode
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const postcode = searchParams.get("postcode") ?? undefined;

    if (!category || !(ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json(
        { error: "category must be one of: mortgage_broker, conveyancing, surveying" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("search_providers", {
      p_service_category: category as AllowedCategory,
      p_postcode: postcode ?? null,
      p_limit: 20,
    });

    if (error) {
      console.error("[services] RPC error:", error);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    return NextResponse.json(
      { providers: (data ?? []) as ProviderResult[] },
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      },
    );
  } catch (error) {
    console.error("[services] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
