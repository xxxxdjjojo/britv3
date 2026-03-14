import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentViewingSlots,
  createViewingSlot,
  deleteViewingSlot,
} from "@/services/agent/agent-viewing-service";

/**
 * GET /api/agent/viewings
 *
 * Returns viewing slots for the authenticated agent.
 *
 * Query params:
 * - property_id: optional UUID filter
 * - start: optional ISO 8601 date range start
 * - end: optional ISO 8601 date range end
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
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const dateRange =
      start && end ? { start, end } : undefined;

    const slots = await getAgentViewingSlots(
      supabase,
      user.id,
      propertyId,
      dateRange,
    );

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/agent/viewings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/viewings
 *
 * Create a new viewing slot.
 *
 * Body:
 * - property_id: string (UUID, required)
 * - start_time: string (ISO 8601, required)
 * - end_time: string (ISO 8601, required)
 * - notes: string (optional)
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

    if (
      !body.property_id ||
      typeof body.property_id !== "string" ||
      !body.start_time ||
      typeof body.start_time !== "string" ||
      !body.end_time ||
      typeof body.end_time !== "string"
    ) {
      return NextResponse.json(
        { error: "property_id, start_time, and end_time are required" },
        { status: 400 },
      );
    }

    const slot = await createViewingSlot(supabase, user.id, {
      property_id: body.property_id,
      start_time: body.start_time,
      end_time: body.end_time,
      notes: typeof body.notes === "string" ? body.notes : null,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agent/viewings error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/agent/viewings
 *
 * Delete a viewing slot (only if not booked).
 *
 * Query params:
 * - slot_id: UUID of the slot to delete (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const slotId = searchParams.get("slot_id");

    if (!slotId) {
      return NextResponse.json(
        { error: "slot_id query parameter is required" },
        { status: 400 },
      );
    }

    await deleteViewingSlot(supabase, slotId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/agent/viewings error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
