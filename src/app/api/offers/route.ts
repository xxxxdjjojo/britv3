import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOffers,
  submitOffer,
  isServiceError,
} from "@/services/offers/offers-service";
import {
  recordIntroduction,
  recordIntroductionEvent,
} from "@/services/truedeed/introduction-service";

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

    const result = await getOffers(supabase, user.id);

    if (isServiceError(result)) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { listingId, amountGBP, agentId, aipDocumentId } = body as {
      listingId?: unknown;
      amountGBP?: unknown;
      agentId?: unknown;
      aipDocumentId?: unknown;
    };

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }
    if (amountGBP === undefined || typeof amountGBP !== "number" || amountGBP <= 0) {
      return NextResponse.json(
        { error: "amountGBP must be a positive number" },
        { status: 400 },
      );
    }
    if (!agentId || typeof agentId !== "string") {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    // Require AIP document for offers above £250,000
    const AIP_THRESHOLD_GBP = 250000;
    if (amountGBP > AIP_THRESHOLD_GBP && !aipDocumentId) {
      return NextResponse.json(
        { error: "AIP_REQUIRED" },
        { status: 422 },
      );
    }

    const result = await submitOffer(
      supabase,
      user.id,
      listingId,
      amountGBP,
      agentId,
      typeof aipDocumentId === "string" ? aipDocumentId : undefined,
    );

    if (isServiceError(result)) {
      if (result.error === "DUPLICATE_OFFER") {
        return NextResponse.json({ error: "DUPLICATE_OFFER" }, { status: 409 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Analytics tracked client-side via hooks

    // Truedeed §5 capture hook — ensure the introduction exists, then log
    // the offer relay. Fire-and-forget, never breaks the offer.
    try {
      await recordIntroduction({
        applicantId: user.id,
        listingId,
        contactType: "enquiry",
      });
      await recordIntroductionEvent({
        applicantId: user.id,
        listingId,
        eventType: "offer_relayed",
        payload: { offerId: result.offerId },
      });
    } catch (hookErr) {
      console.warn("[truedeed] introduction capture failed (offer)", {
        error_type: hookErr instanceof Error ? hookErr.name : "unknown",
      });
    }

    return NextResponse.json({ offerId: result.offerId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

