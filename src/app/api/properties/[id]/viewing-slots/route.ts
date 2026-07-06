/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/uuid";

// ---------------------------------------------------------------------------
// GET /api/properties/[id]/viewing-slots
// Returns available viewing slots for a property
// ---------------------------------------------------------------------------

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: propertyId } = await params;

  if (!propertyId) {
    return NextResponse.json({ error: "Missing property id" }, { status: 400 });
  }

  if (!isUuid(propertyId)) {
    return NextResponse.json({ slots: [] }, { status: 200 });
  }

  const supabase = await createClient();

  // viewing_slots columns are start_time/end_time/listing_id (see
  // 20260313100000_v3_1_buyer_dashboard_foundation.sql). Alias back to the
  // starts_at/ends_at shape the BookViewingModal consumer expects.
  const { data, error } = await supabase
    .from("viewing_slots")
    .select("id, starts_at:start_time, ends_at:end_time")
    .eq("listing_id", propertyId)
    .eq("status", "available")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[viewing-slots] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch viewing slots" }, { status: 500 });
  }

  return NextResponse.json({ slots: data ?? [] });
}
