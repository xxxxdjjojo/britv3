import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { editReview } from "@/services/marketplace/review-service";

/**
 * PATCH /api/reviews/[id]/edit
 * Edit a review within the 48-hour window. Auth required (reviewer only).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id: reviewId } = await params;
    const body = await request.json();

    const review = await editReview(supabase, user.id, reviewId, body);

    return NextResponse.json({ data: review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to edit review";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("only edit your own")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("window has expired") || message.includes("Maximum number")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("[api/reviews/edit] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
