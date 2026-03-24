import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getViewingFeedback,
  submitViewingFeedback,
} from "@/services/agent/agent-viewing-service";

/**
 * GET /api/agent/viewings/feedback
 *
 * Returns post-viewing feedback for the authenticated agent.
 *
 * Query params:
 * - property_id: optional UUID filter
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get("property_id") ?? undefined;

    const feedbackList = await getViewingFeedback(supabase, user.id, propertyId);

    return NextResponse.json({ feedback: feedbackList });
  } catch (error) {
    console.error("GET /api/agent/viewings/feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/viewings/feedback
 *
 * Submit post-viewing feedback for a viewing slot.
 *
 * Body:
 * - viewing_slot_id: string (UUID, required)
 * - buyer_name: string (optional)
 * - interest_level: number 1-5 (optional)
 * - price_opinion: "too_high" | "about_right" | "good_value" (optional)
 * - likelihood_to_offer: "unlikely" | "possible" | "likely" | "very_likely" (optional)
 * - comments: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.viewing_slot_id || typeof body.viewing_slot_id !== "string") {
      return NextResponse.json(
        { error: "viewing_slot_id is required" },
        { status: 400 },
      );
    }

    const feedback = await submitViewingFeedback(supabase, user.id, {
      viewing_slot_id: body.viewing_slot_id,
      buyer_name: typeof body.buyer_name === "string" ? body.buyer_name : "",
      interest_level: typeof body.interest_level === "number" ? body.interest_level : 0,
      price_opinion:
        body.price_opinion === "too_high" ||
        body.price_opinion === "about_right" ||
        body.price_opinion === "good_value"
          ? body.price_opinion
          : "",
      likelihood_to_offer:
        body.likelihood_to_offer === "unlikely" ||
        body.likelihood_to_offer === "possible" ||
        body.likelihood_to_offer === "likely" ||
        body.likelihood_to_offer === "very_likely"
          ? body.likelihood_to_offer
          : "",
      comments: typeof body.comments === "string" ? body.comments : "",
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agent/viewings/feedback error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
