import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  bookViewing,
  getAvailableSlots,
  isServiceError,
} from "@/services/viewings/viewings-service";
import {
  recordIntroduction,
  recordIntroductionEvent,
} from "@/services/truedeed/introduction-service";

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

    const { viewingSlotId, listingId, type } = body as {
      viewingSlotId?: unknown;
      listingId?: unknown;
      type?: unknown;
    };

    if (!viewingSlotId || typeof viewingSlotId !== "string") {
      return NextResponse.json({ error: "viewingSlotId is required" }, { status: 400 });
    }
    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }
    if (!type || (type !== "in_person" && type !== "virtual")) {
      return NextResponse.json(
        { error: "type must be 'in_person' or 'virtual'" },
        { status: 400 },
      );
    }

    // Verify the slot is still available (pre-check, RPC does the atomic lock)
    const slots = await getAvailableSlots(supabase, listingId);
    if (!isServiceError(slots)) {
      const slot = slots.find((s) => s.id === viewingSlotId);
      if (!slot) {
        return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
      }
    }

    const result = await bookViewing(supabase, user.id, viewingSlotId, listingId, type);

    if (isServiceError(result)) {
      if (result.error === "SLOT_UNAVAILABLE") {
        return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
      }
      if (result.error === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Analytics tracked client-side via hooks

    // Truedeed §5 capture hook — fire-and-forget, never breaks the booking
    try {
      await recordIntroduction({
        applicantId: user.id,
        listingId,
        contactType: "viewing_request",
      });
      await recordIntroductionEvent({
        applicantId: user.id,
        listingId,
        eventType: "viewing_booked",
        payload: { viewingId: result.viewingId },
      });
    } catch (hookErr) {
      console.warn("[truedeed] introduction capture failed (viewing)", {
        error_type: hookErr instanceof Error ? hookErr.name : "unknown",
      });
    }

    return NextResponse.json({ viewingId: result.viewingId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
