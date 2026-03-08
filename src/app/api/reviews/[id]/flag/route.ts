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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
