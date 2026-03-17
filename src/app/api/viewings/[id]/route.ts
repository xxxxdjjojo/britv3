import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  cancelViewing,
  rescheduleViewing,
  isServiceError,
} from "@/services/viewings/viewings-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: viewingId } = await params;
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

    const { newSlotId } = body as { newSlotId?: unknown };

    if (!newSlotId || typeof newSlotId !== "string") {
      return NextResponse.json({ error: "newSlotId is required" }, { status: 400 });
    }

    const result = await rescheduleViewing(supabase, viewingId, newSlotId);

    if (isServiceError(result)) {
      if (result.error === "SLOT_UNAVAILABLE") {
        return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
      }
      if (result.error === "NOT_FOUND") {
        return NextResponse.json({ error: "Viewing not found" }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: viewingId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cancelViewing(supabase, viewingId);

    if (isServiceError(result)) {
      if (result.error === "NOT_FOUND") {
        return NextResponse.json({ error: "Viewing not found" }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
