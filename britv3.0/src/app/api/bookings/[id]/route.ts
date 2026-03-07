import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBooking } from "@/services/marketplace/booking-service";

export async function GET(
  _request: Request,
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
    const booking = await getBooking(supabase, id);

    return NextResponse.json({ data: booking }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get booking";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
