import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { flagReview } from "@/services/marketplace/review-service";

/**
 * POST /api/reviews/[id]/flag
 * Flag a review for moderation. Auth required.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  // Rate limit: max 10 flags per user per 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("review_flags")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", twentyFourHoursAgo);

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 10 flags per 24 hours." },
      { status: 429 },
    );
  }

  try {
    const { id: reviewId } = await params;
    const body = await request.json();

    const flag = await flagReview(supabase, user.id, reviewId, body);

    return NextResponse.json({ data: flag }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to flag review";

    if (message.includes("Cannot flag your own review")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes("already flagged")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
