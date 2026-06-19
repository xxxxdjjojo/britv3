import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateReview } from "@/services/marketplace/moderation-service";
import { sendReviewPublished, sendReviewRemoved } from "@/services/email/email-service";

/**
 * PATCH /api/reviews/moderation/[id]
 * Moderate a review in the queue. Auth required (admin only).
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
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { id: queueEntryId } = await params;
    const body = await request.json();

    if (!body.decision || !["approve", "reject", "flag_for_review"].includes(body.decision)) {
      return NextResponse.json(
        { error: "decision must be 'approve', 'reject', or 'flag_for_review'" },
        { status: 400 },
      );
    }

    const result = await moderateReview(
      supabase,
      user.id,
      queueEntryId,
      body.decision,
      body.reason,
    );

    // Fire-and-forget: notify reviewer of approval/rejection
    if (body.decision === "approve" || body.decision === "reject") {
      const review = result?.reviews as Record<string, unknown> | null;
      const reviewerId = review?.reviewer_id as string | undefined;
      const reviewId = review?.id as string | undefined;
      if (reviewerId) {
        const { data: reviewer } = await supabase
          .from("user_profiles")
          .select("first_name, email")
          .eq("user_id", reviewerId)
          .single();

        const { data: provider } = review?.provider_id
          ? await supabase
              .from("user_profiles")
              .select("first_name, business_name")
              .eq("user_id", review.provider_id as string)
              .single()
          : { data: null };

        if (reviewer?.email) {
          const providerName = (provider?.business_name ?? provider?.first_name ?? "the provider") as string;
          const reviewTitle = (review?.title as string) ?? "your review";
          const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://truedeed.co.uk"}/reviews/${reviewId}`;

          if (body.decision === "approve") {
            void sendReviewPublished({
              userId: reviewerId,
              email: reviewer.email as string,
              recipientFirstName: (reviewer.first_name as string) ?? "there",
              reviewTitle,
              providerName,
              reviewUrl,
            });
          } else {
            void sendReviewRemoved({
              userId: reviewerId,
              email: reviewer.email as string,
              recipientFirstName: (reviewer.first_name as string) ?? "there",
              reviewTitle,
              providerName,
              reason: body.reason ?? "This review did not meet our community guidelines.",
            });
          }
        }
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to moderate review";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
