import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listProviderReviews } from "@/services/marketplace/review-service";

/**
 * GET /api/reviews/list
 * List approved reviews for a provider. Public access for approved reviews.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const providerId = searchParams.get("provider_id");
  if (!providerId) {
    return NextResponse.json(
      { error: "provider_id is required" },
      { status: 400 },
    );
  }

  const sort = (searchParams.get("sort") ?? "recent") as "recent" | "helpful" | "relevant";
  const minRating = searchParams.get("min_rating")
    ? Number(searchParams.get("min_rating"))
    : undefined;
  const maxRating = searchParams.get("max_rating")
    ? Number(searchParams.get("max_rating"))
    : undefined;
  const searchQuery = searchParams.get("search_query") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;
  const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;

  try {
    const supabase = await createClient();

    const result = await listProviderReviews(supabase, providerId, {
      sort,
      minRating,
      maxRating,
      searchQuery,
      limit,
      offset,
    });

    // Fetch rating stats for the provider
    const { data: ratingStats } = await supabase
      .from("provider_rating_stats")
      .select("*")
      .eq("provider_id", providerId)
      .maybeSingle();

    return NextResponse.json({
      data: result.reviews,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        rating_stats: ratingStats ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
