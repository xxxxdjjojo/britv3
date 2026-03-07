import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBooking } from "@/services/marketplace/booking-service";

export async function POST(request: Request) {
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

    const body = await request.json();
    const booking = await createBooking(supabase, user.id, body);

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create booking";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("Date conflict")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes("must be accepted") || message.includes("Only the RFQ owner")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
