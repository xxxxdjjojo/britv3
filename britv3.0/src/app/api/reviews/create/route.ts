import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReview } from "@/services/marketplace/review-service";

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

  try {
    const body = await request.json();

    if (!body.booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 },
      );
    }

    const review = await createReview(supabase, user.id, body);

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
