/**
 * API routes for a specific viewing by ID.
 * DELETE: cancel viewing
 * PATCH: reschedule viewing
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  cancelViewing,
  rescheduleViewing,
} from "@/services/viewings/viewings-service";

/**
 * DELETE /api/viewings/[id] - Cancel a viewing
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Viewing ID is required" },
        { status: 400 },
      );
    }

    const result = await cancelViewing(supabase, id);

    if (!result.success) {
      const status = result.error === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[viewings/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/viewings/[id] - Reschedule a viewing
 * Body: { new_slot_id: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Viewing ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { new_slot_id } = body as { new_slot_id?: string };

    if (!new_slot_id || typeof new_slot_id !== "string") {
      return NextResponse.json(
        { error: "new_slot_id is required" },
        { status: 400 },
      );
    }

    const result = await rescheduleViewing(supabase, id, new_slot_id);

    if (!result.success) {
      const status =
        result.error === "NOT_FOUND"
          ? 404
          : result.error === "SLOT_UNAVAILABLE"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[viewings/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
