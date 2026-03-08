import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProviderAvailability,
  setProviderAvailability,
} from "@/services/marketplace/booking-service";

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
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");

    const result = await getProviderAvailability(
      supabase,
      user.id,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get availability";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

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
    const { start_date, end_date, reason } = body as {
      start_date: string;
      end_date: string;
      reason?: string;
    };

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: "start_date and end_date are required" },
        { status: 400 },
      );
    }

    await setProviderAvailability(
      supabase,
      user.id,
      new Date(start_date),
      new Date(end_date),
      reason,
    );

    return NextResponse.json(
      { data: { message: "Unavailability period set" } },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to set availability";

    if (message.includes("End date must be after")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
