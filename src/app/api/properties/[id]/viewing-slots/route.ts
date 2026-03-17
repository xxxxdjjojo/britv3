import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("viewing_slots")
    .select("id, starts_at, ends_at")
    .eq("property_id", propertyId)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[viewing-slots] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch viewing slots" }, { status: 500 });
  }

  return NextResponse.json({ slots: data ?? [] });
}
