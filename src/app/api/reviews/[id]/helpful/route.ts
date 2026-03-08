import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { voteHelpfulness } from "@/services/marketplace/review-service";

/**
 * POST /api/reviews/[id]/helpful
 * Vote on whether a review is helpful. Auth required.
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

    if (typeof body.is_helpful !== "boolean") {
      return NextResponse.json(
        { error: "is_helpful (boolean) is required" },
        { status: 400 },
      );
    }

    const result = await voteHelpfulness(supabase, user.id, reviewId, body.is_helpful);

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to vote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
