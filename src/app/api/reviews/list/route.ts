import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listProviderReviews } from "@/services/marketplace/review-service";

const reviewsQuerySchema = z.object({
  provider_id: z.string().uuid(),
  sort: z.enum(["recent", "helpful", "relevant"]).default("recent"),
  min_rating: z.coerce.number().int().min(1).max(5).optional(),
  max_rating: z.coerce.number().int().min(1).max(5).optional(),
  search_query: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

/**
 * GET /api/reviews/list
 * List approved reviews for a provider. Public access for approved reviews.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = reviewsQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const {
    provider_id: providerId,
    sort,
    min_rating: minRating,
    max_rating: maxRating,
    search_query: searchQuery,
    limit,
    offset,
  } = parsed.data;

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
