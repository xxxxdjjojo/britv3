/**
 * /api/agent/viewings/feedback
 *
 * POST -- submit viewing feedback for a completed viewing slot.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitViewingFeedback } from "@/services/agent/agent-viewing-service";
import type { InterestLevel, PriceOpinion, LikelihoodToOffer } from "@/types/agent";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      viewing_slot_id?: string;
      buyer_name?: string;
      interest_level?: InterestLevel;
      price_opinion?: PriceOpinion;
      likelihood_to_offer?: LikelihoodToOffer;
      comments?: string;
    };

    if (!body.viewing_slot_id || !body.buyer_name || !body.interest_level) {
      return NextResponse.json(
        { error: "viewing_slot_id, buyer_name, and interest_level are required" },
        { status: 400 },
      );
    }

    const feedback = await submitViewingFeedback(supabase, user.id, {
      viewing_slot_id: body.viewing_slot_id,
      buyer_name: body.buyer_name,
      interest_level: body.interest_level,
      price_opinion: body.price_opinion ?? "about_right",
      likelihood_to_offer: body.likelihood_to_offer ?? "possible",
      comments: body.comments,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to submit viewing feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
