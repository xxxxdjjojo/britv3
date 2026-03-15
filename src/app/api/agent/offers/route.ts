import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentOffers,
  createOffer,
  updateOfferStatus,
  counterOffer,
} from "@/services/agent/agent-offer-service";
import { createOfferSchema, OFFER_STATUSES } from "@/types/agent";
import type { OfferStatus } from "@/types/agent";
import { sendOfferReceived, sendOfferStatus, BASE_URL } from "@/services/email/email-service";

/**
 * GET /api/agent/offers
 *
 * Returns offers for the authenticated agent.
 *
 * Query params:
 * - property_id: optional UUID filter
 * - status: optional OfferStatus filter
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
    const statusParam = searchParams.get("status");
    const status =
      statusParam && (OFFER_STATUSES as readonly string[]).includes(statusParam)
        ? (statusParam as OfferStatus)
        : undefined;

    const offers = await getAgentOffers(supabase, user.id, propertyId, status);

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("GET /api/agent/offers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/offers
 *
 * Create a new offer in 'pending' status.
 * Body is validated against createOfferSchema.
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

    const body = await request.json();
    const parsed = createOfferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const offer = await createOffer(supabase, user.id, parsed.data);

    // Fire-and-forget: notify agent of the new offer they just logged
    // (agents typically create offers on behalf of buyers; notify the agent for their records)
    try {
      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", user.id)
        .single();

      // Derive property address — best-effort from listings table
      const { data: listing } = await supabase
        .from("listings")
        .select("address_line1, town_city")
        .eq("id", offer.property_id)
        .maybeSingle();

      const propertyAddress = listing
        ? `${listing.address_line1 ?? ""}${listing.town_city ? `, ${listing.town_city}` : ""}`.trim()
        : offer.property_id;

      if (agentProfile?.email) {
        const agentFirstName =
          (agentProfile.display_name as string | undefined)?.split(" ")[0] ?? "";
        void sendOfferReceived({
          userId: user.id,
          email: agentProfile.email as string,
          agentFirstName,
          propertyAddress,
          offerAmount: offer.amount,
          buyerName: offer.buyer_name,
          submittedAt: offer.created_at,
          dashboardUrl: `${BASE_URL}/dashboard/agent/offers`,
        });
      }
    } catch (emailError) {
      console.error("POST /api/agent/offers sendOfferReceived error:", emailError);
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agent/offers error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/agent/offers
 *
 * Update offer status or submit a counter-offer.
 *
 * Body:
 * - offer_id: string (UUID, required)
 * - action: "update_status" | "counter" (required)
 *
 * For action="update_status":
 * - status: OfferStatus (required)
 * - note: string (optional)
 *
 * For action="counter":
 * - counter_amount: number (pence, required)
 * - note: string (optional)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.offer_id || typeof body.offer_id !== "string") {
      return NextResponse.json(
        { error: "offer_id is required" },
        { status: 400 },
      );
    }

    if (!body.action || typeof body.action !== "string") {
      return NextResponse.json(
        { error: "action is required (update_status or counter)" },
        { status: 400 },
      );
    }

    const offerId = body.offer_id;
    const note = typeof body.note === "string" ? body.note : undefined;

    if (body.action === "update_status") {
      const statusParam = body.status;

      if (
        !statusParam ||
        typeof statusParam !== "string" ||
        !(OFFER_STATUSES as readonly string[]).includes(statusParam)
      ) {
        return NextResponse.json(
          {
            error: `status must be one of: ${OFFER_STATUSES.join(", ")}`,
          },
          { status: 400 },
        );
      }

      const offer = await updateOfferStatus(
        supabase,
        offerId,
        user.id,
        statusParam as OfferStatus,
        note,
      );

      // Fire-and-forget: notify buyer of their offer status change (accepted / rejected)
      if (
        (statusParam === "accepted" || statusParam === "rejected") &&
        offer.buyer_email
      ) {
        try {
          // Derive property address — best-effort from listings table
          const { data: listing } = await supabase
            .from("listings")
            .select("address_line1, town_city")
            .eq("id", offer.property_id)
            .maybeSingle();

          const propertyAddress = listing
            ? `${listing.address_line1 ?? ""}${listing.town_city ? `, ${listing.town_city}` : ""}`.trim()
            : offer.property_id;

          const buyerFirstName = offer.buyer_name.split(" ")[0] ?? offer.buyer_name;

          void sendOfferStatus({
            userId: offer.buyer_email, // userId used for pref lookup; use email as fallback key
            email: offer.buyer_email,
            firstName: buyerFirstName,
            propertyAddress,
            offerAmount: offer.amount,
            status: statusParam,
            message: note,
          });
        } catch (emailError) {
          console.error("PATCH /api/agent/offers sendOfferStatus error:", emailError);
        }
      }

      return NextResponse.json({ offer });
    }

    if (body.action === "counter") {
      const counterAmount = body.counter_amount;

      if (
        typeof counterAmount !== "number" ||
        !Number.isInteger(counterAmount) ||
        counterAmount <= 0
      ) {
        return NextResponse.json(
          { error: "counter_amount must be a positive integer (pence)" },
          { status: 400 },
        );
      }

      const offer = await counterOffer(
        supabase,
        offerId,
        user.id,
        counterAmount,
        note,
      );

      return NextResponse.json({ offer });
    }

    return NextResponse.json(
      { error: "action must be update_status or counter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("PATCH /api/agent/offers error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
