/**
 * API routes for offers (buyer perspective).
 * GET: list offers submitted by the authenticated user
 * POST: submit a new offer on a listing
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyOffers, submitOffer } from "@/services/offers/offers-service";

/**
 * GET /api/offers — list my submitted offers
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const offers = await getMyOffers(supabase, user.id);
    return NextResponse.json(offers);
  } catch (error) {
    console.error("[offers] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/offers — submit a new offer
 * Body: { listing_id: string, agent_id: string, amount_gbp: number, conditions?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      listing_id?: unknown;
      agent_id?: unknown;
      amount_gbp?: unknown;
      conditions?: unknown;
    };

    const { listing_id, agent_id, amount_gbp, conditions } = body;

    if (!listing_id || typeof listing_id !== "string") {
      return NextResponse.json(
        { error: "listing_id is required and must be a string" },
        { status: 400 },
      );
    }

    if (!agent_id || typeof agent_id !== "string") {
      return NextResponse.json(
        { error: "agent_id is required and must be a string" },
        { status: 400 },
      );
    }

    if (typeof amount_gbp !== "number" || amount_gbp <= 0) {
      return NextResponse.json(
        { error: "amount_gbp must be a positive number" },
        { status: 400 },
      );
    }

    const conditionsStr =
      typeof conditions === "string" ? conditions : undefined;

    const result = await submitOffer(
      supabase,
      user.id,
      listing_id,
      agent_id,
      amount_gbp,
      conditionsStr,
    );

    if ("error" in result) {
      if (result.error === "DUPLICATE_OFFER") {
        return NextResponse.json(
          { error: "You already have an active offer on this property" },
          { status: 409 },
        );
      }
      if (result.error === "INVALID_LISTING") {
        return NextResponse.json(
          { error: "Listing or agent not found" },
          { status: 422 },
        );
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.offer, { status: 201 });
  } catch (error) {
    console.error("[offers] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
