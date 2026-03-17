import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentViewingSlots,
  createViewingSlot,
  deleteViewingSlot,
} from "@/services/agent/agent-viewing-service";

/**
 * GET /api/agent/viewings
 * Returns viewing slots for the authenticated agent.
 * Optional query params: ?property_id, ?start, ?end (ISO date strings)
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
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const dateRange =
    start && end ? { start, end } : undefined;

  try {
    const slots = await getAgentViewingSlots(
      supabase,
      user.id,
      propertyId,
      dateRange,
    );
    return NextResponse.json(slots);
  } catch (error) {
    console.error("Failed to fetch viewing slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch viewing slots" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/viewings
 * Create a new viewing slot.
 * Body: { property_id, start_time, end_time, notes? }
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

  const input = body as {
    property_id?: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  };

  if (!input.property_id || !input.start_time || !input.end_time) {
    return NextResponse.json(
      { error: "property_id, start_time, and end_time are required" },
      { status: 400 },
    );
  }

  try {
    const slot = await createViewingSlot(supabase, user.id, {
      property_id: input.property_id,
      start_time: input.start_time,
      end_time: input.end_time,
      notes: input.notes,
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create viewing slot";
    console.error("Failed to create viewing slot:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/agent/viewings
 * Delete a viewing slot (only if not booked).
 * Query param: ?slot_id
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slotId = request.nextUrl.searchParams.get("slot_id");

  if (!slotId) {
    return NextResponse.json(
      { error: "slot_id query parameter is required" },
      { status: 400 },
    );
  }

  try {
    await deleteViewingSlot(supabase, slotId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete viewing slot";
    console.error("Failed to delete viewing slot:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
