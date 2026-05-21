/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReview } from "@/services/marketplace/review-service";
import { sendReviewReceived, BASE_URL } from "@/services/email/email-service";

/**
 * POST /api/reviews/create
 * Create a review for a completed booking. Auth required.
 */
export async function POST(request: Request) {
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

  // Rate limit: max 3 reviews per user per 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", user.id)
    .gte("created_at", twentyFourHoursAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 3 reviews per 24 hours." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const verificationType = body.verification_type ?? "booking";

    if (verificationType === "booking" && !body.booking_id) {
      return NextResponse.json(
        { error: "booking_id is required for booking-type reviews" },
        { status: 400 },
      );
    }

    if (verificationType !== "booking" && !body.provider_id) {
      return NextResponse.json(
        { error: "provider_id is required for non-booking reviews" },
        { status: 400 },
      );
    }

    const review = await createReview(supabase, user.id, body);

    // Fire-and-forget: notify the provider that they received a new review
    try {
      const { data: providerProfile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", review.provider_id)
        .single();

      const { data: reviewerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (providerProfile?.email) {
        const providerFirstName =
          (providerProfile.display_name as string | undefined)?.split(" ")[0] ?? "";
        const reviewerName =
          (reviewerProfile?.display_name as string | undefined) ?? "A customer";

        void sendReviewReceived({
          userId: review.provider_id as string,
          email: providerProfile.email as string,
          recipientFirstName: providerFirstName,
          reviewerName,
          rating: review.overall_rating as number,
          reviewUrl: `${BASE_URL}/dashboard/provider/reviews`,
          comment: review.review_text as string | undefined,
        });
      }
    } catch (emailError) {
      console.error("POST /api/reviews/create sendReviewReceived error:", emailError);
    }

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create review";

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes("not found") || message.includes("not completed") || message.includes("own bookings")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
