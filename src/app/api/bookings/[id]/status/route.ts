import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateBookingStatus } from "@/services/marketplace/booking-service";
import type { BookingStatus } from "@/types/marketplace";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body as {
      status: BookingStatus;
      reason?: string;
    };

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    const booking = await updateBookingStatus(
      supabase,
      user.id,
      id,
      status,
      reason,
    );

    return NextResponse.json({ data: booking }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update booking status";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("Cannot transition")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes("Reason is required")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
