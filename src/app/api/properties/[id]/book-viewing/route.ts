/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/properties/[id]/book-viewing
// Atomically claims a viewing slot for the authenticated user.
//
// CRITICAL (G3): Uses an atomic RPC to prevent concurrent double-bookings.
// Do NOT replace with a SELECT + UPDATE pair — that creates a TOCTOU race.
//
// Required DB function (run in Supabase SQL editor):
// CREATE OR REPLACE FUNCTION claim_viewing_slot(p_slot_id UUID, p_user_id UUID)
// RETURNS JSON AS $$
// DECLARE slot_record RECORD;
// BEGIN
//   SELECT * INTO slot_record FROM viewing_slots WHERE id = p_slot_id AND status = 'available' FOR UPDATE;
//   IF NOT FOUND THEN RETURN json_build_object('error', 'slot_taken'); END IF;
//   UPDATE viewing_slots SET status = 'booked', user_id = p_user_id WHERE id = p_slot_id;
//   RETURN json_build_object('success', true, 'slot_id', p_slot_id);
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
// ---------------------------------------------------------------------------

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RequestBody = {
  slotId: string;
};

type RpcResult = {
  success?: boolean;
  error?: string;
  slot_id?: string;
  viewing_id?: string;
};

export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: propertyId } = await params;

  if (!propertyId) {
    return NextResponse.json({ error: "Missing property id" }, { status: 400 });
  }

  // Parse body
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { slotId } = body;
  if (!slotId || typeof slotId !== "string") {
    return NextResponse.json({ error: "Missing or invalid slotId" }, { status: 400 });
  }

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify the slot belongs to this property (prevents IDOR).
  // viewing_slots keys the property via `listing_id` (a listing IS the property here);
  // there is no `property_id` column on this table.
  const { data: slotRow, error: slotLookupError } = await supabase
    .from("viewing_slots")
    .select("id, listing_id, status")
    .eq("id", slotId)
    .eq("listing_id", propertyId)
    .single();

  if (slotLookupError || !slotRow) {
    return NextResponse.json({ error: "Slot not found for this property" }, { status: 404 });
  }

  // Quick pre-flight: if already booked, short-circuit before hitting the RPC
  if (slotRow.status !== "available") {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  // Atomic claim via DB RPC (G3 — no TOCTOU race)
  const { data: rpcData, error: rpcError } = await supabase.rpc("claim_viewing_slot", {
    p_slot_id: slotId,
    p_user_id: user.id,
  });

  if (rpcError) {
    console.error("[book-viewing] RPC error:", rpcError.message);
    // Check if the RPC signals slot contention
    if (
      rpcError.message.includes("slot_taken") ||
      rpcError.message.includes("not available") ||
      rpcError.code === "P0001"
    ) {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to book viewing" }, { status: 500 });
  }

  const result = rpcData as RpcResult | null;

  if (!result) {
    return NextResponse.json({ error: "No result from booking RPC" }, { status: 500 });
  }

  if (result.error === "slot_taken") {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  if (!result.success) {
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    slotId: result.slot_id ?? slotId,
    viewingId: result.viewing_id ?? null,
  });
}
