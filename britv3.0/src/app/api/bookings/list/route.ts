import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listBookings } from "@/services/marketplace/booking-service";
import type { BookingStatus } from "@/types/marketplace";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const role = (searchParams.get("role") ?? "user") as "user" | "provider";
    const status = searchParams.get("status") as BookingStatus | null;
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    if (role !== "user" && role !== "provider") {
      return NextResponse.json(
        { error: "role must be 'user' or 'provider'" },
        { status: 400 },
      );
    }

    const result = await listBookings(
      supabase,
      user.id,
      role,
      status ?? undefined,
      limit,
      offset,
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list bookings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
