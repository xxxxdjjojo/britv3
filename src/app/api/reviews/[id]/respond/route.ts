import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { respondToReview } from "@/services/marketplace/review-service";
import { sendReviewResponse } from "@/services/email/email-service";

/**
 * POST /api/reviews/[id]/respond
 * Post or update a provider response to a review. Auth required (provider only).
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

    if (!body.response || typeof body.response !== "string") {
      return NextResponse.json(
        { error: "response (string) is required" },
        { status: 400 },
      );
    }

    const review = await respondToReview(supabase, user.id, reviewId, body.response);

    // Fire-and-forget: notify the reviewer that the provider responded
    const reviewerId = (review as Record<string, unknown>)?.reviewer_id as string | undefined;
    if (reviewerId) {
      const { data: reviewer } = await supabase
        .from("user_profiles")
        .select("first_name, email")
        .eq("user_id", reviewerId)
        .single();

      const { data: provider } = await supabase
        .from("user_profiles")
        .select("first_name, business_name")
        .eq("user_id", user.id)
        .single();

      if (reviewer?.email) {
        const providerName = (provider?.business_name ?? provider?.first_name ?? "the provider") as string;
        const responsePreview = body.response.slice(0, 100);
        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/reviews/${reviewId}`;

        void sendReviewResponse({
          userId: reviewerId,
          email: reviewer.email as string,
          recipientFirstName: (reviewer.first_name as string) ?? "there",
          providerName,
          responsePreview,
          reviewUrl,
        });
      }
    }

    return NextResponse.json({ data: review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to respond";

    if (message.includes("Only the reviewed provider")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
