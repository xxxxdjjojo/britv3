/**
 * /api/agent/offers
 *
 * GET   -- list offers, optional ?property_id, ?status filters.
 * POST  -- create a new offer (validates with createOfferSchema).
 * PATCH -- update offer status or submit a counter-offer.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOfferSchema } from "@/types/agent";
import type { OfferStatus } from "@/types/agent";
import {
  getAgentOffers,
  createOffer,
  updateOfferStatus,
  counterOffer,
} from "@/services/agent/agent-offer-service";
import { getTeamMemberRole } from "@/services/agent/agent-team-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const propertyId = params.get("property_id") ?? undefined;
    const status = params.get("status") as OfferStatus | null;

    const offers = await getAgentOffers(
      supabase,
      user.id,
      propertyId,
      status ?? undefined,
    );
    return NextResponse.json({ offers });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch offers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = request.nextUrl.searchParams.get("agent_id") ?? user.id;
    const role = await getTeamMemberRole(supabase, agentId, user.id);
    if (role === null || role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createOfferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const offer = await createOffer(supabase, user.id, parsed.data);
    return NextResponse.json({ offer }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create offer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = request.nextUrl.searchParams.get("agent_id") ?? user.id;
    const role = await getTeamMemberRole(supabase, agentId, user.id);
    if (role === null || role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      id?: string;
      action?: "update_status" | "counter";
      status?: OfferStatus;
      counter_amount?: number;
      note?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Offer id is required" },
        { status: 400 },
      );
    }

    if (!body.action) {
      return NextResponse.json(
        { error: "Action is required (update_status or counter)" },
        { status: 400 },
      );
    }

    if (body.action === "update_status") {
      if (!body.status) {
        return NextResponse.json(
          { error: "Status is required for update_status action" },
          { status: 400 },
        );
      }

      const offer = await updateOfferStatus(
        supabase,
        body.id,
        user.id,
        body.status,
        body.note,
      );
      return NextResponse.json({ offer });
    }

    if (body.action === "counter") {
      if (!body.counter_amount) {
        return NextResponse.json(
          { error: "counter_amount is required for counter action" },
          { status: 400 },
        );
      }

      const offer = await counterOffer(
        supabase,
        body.id,
        user.id,
        body.counter_amount,
        body.note,
      );
      return NextResponse.json({ offer });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update offer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
