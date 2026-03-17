import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentOffers,
  createOffer,
  updateOfferStatus,
  counterOffer,
} from "@/services/agent/agent-offer-service";
import { createOfferSchema } from "@/types/agent";

/**
 * GET /api/agent/offers
 * Returns offers for the authenticated agent.
 * Optional query params: ?property_id, ?status
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const propertyId = searchParams.get("property_id") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  try {
    const offers = await getAgentOffers(supabase, user.id, propertyId, status);
    return NextResponse.json(offers);
  } catch (error) {
    console.error("Failed to fetch offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/offers
 * Create a new offer.
 * Body validated against createOfferSchema.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createOfferSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const offer = await createOffer(supabase, user.id, parsed.data);
    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Failed to create offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/offers
 * Update an offer status.
 * Body: { id, action: 'accept' | 'reject' | 'counter', counter_amount?, note? }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as {
    id?: string;
    action?: string;
    counter_amount?: number;
    note?: string;
  };

  if (!input.id || !input.action) {
    return NextResponse.json(
      { error: "id and action are required" },
      { status: 400 },
    );
  }

  try {
    let updatedOffer;

    if (input.action === "accept") {
      updatedOffer = await updateOfferStatus(
        supabase,
        input.id,
        user.id,
        "accepted",
        input.note,
      );
    } else if (input.action === "reject") {
      updatedOffer = await updateOfferStatus(
        supabase,
        input.id,
        user.id,
        "rejected",
        input.note,
      );
    } else if (input.action === "counter") {
      if (input.counter_amount === undefined || input.counter_amount === null) {
        return NextResponse.json(
          { error: "counter_amount is required for counter action" },
          { status: 400 },
        );
      }
      updatedOffer = await counterOffer(
        supabase,
        input.id,
        user.id,
        input.counter_amount,
        input.note,
      );
    } else {
      return NextResponse.json(
        { error: "action must be one of: accept, reject, counter" },
        { status: 400 },
      );
    }

    return NextResponse.json(updatedOffer);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update offer";
    console.error("Failed to update offer:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
