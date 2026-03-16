/**
 * API routes for viewings.
 * GET: list user's viewings
 * POST: book a viewing slot
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getViewings,
  bookViewingSlot,
} from "@/services/viewings/viewings-service";

/**
 * GET /api/viewings - Get user's viewings
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewings = await getViewings(supabase, user.id);
    return NextResponse.json(viewings);
  } catch (error) {
    console.error("[viewings] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/viewings - Book a viewing slot
 * Body: { slot_id: string, listing_id: string, type: "in_person" | "virtual" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slot_id, listing_id, type } = body as {
      slot_id?: string;
      listing_id?: string;
      type?: string;
    };

    if (!slot_id || typeof slot_id !== "string") {
      return NextResponse.json(
        { error: "slot_id is required" },
        { status: 400 },
      );
    }

    if (!listing_id || typeof listing_id !== "string") {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    if (type !== "in_person" && type !== "virtual") {
      return NextResponse.json(
        { error: "type must be in_person or virtual" },
        { status: 400 },
      );
    }

    const result = await bookViewingSlot(
      supabase,
      user.id,
      slot_id,
      listing_id,
      type,
    );

    if (!result.success) {
      const status = result.error === "SLOT_UNAVAILABLE" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[viewings] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
