/**
 * /api/agent/viewings
 *
 * GET    -- list viewing slots, optional ?property_id, ?start, ?end filters.
 * POST   -- create a new viewing slot.
 * DELETE -- delete an unbooked viewing slot (?slot_id required).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentViewingSlots,
  createViewingSlot,
  deleteViewingSlot,
} from "@/services/agent/agent-viewing-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const propertyId = params.get("property_id") ?? undefined;
    const start = params.get("start");
    const end = params.get("end");

    const dateRange =
      start && end ? { start, end } : undefined;

    const slots = await getAgentViewingSlots(
      supabase,
      user.id,
      propertyId,
      dateRange,
    );
    return NextResponse.json({ slots });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch viewing slots";
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

    const body = (await request.json()) as {
      property_id?: string;
      start_time?: string;
      end_time?: string;
      notes?: string;
    };

    if (!body.property_id || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: "property_id, start_time, and end_time are required" },
        { status: 400 },
      );
    }

    const slot = await createViewingSlot(supabase, user.id, {
      property_id: body.property_id,
      start_time: body.start_time,
      end_time: body.end_time,
      notes: body.notes,
    });
    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create viewing slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slotId = request.nextUrl.searchParams.get("slot_id");

    if (!slotId) {
      return NextResponse.json(
        { error: "slot_id query parameter is required" },
        { status: 400 },
      );
    }

    await deleteViewingSlot(supabase, slotId, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete viewing slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
