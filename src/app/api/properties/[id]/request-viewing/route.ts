/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/uuid";
import { sendViewingRequestEmails } from "@/services/viewings/viewing-notifications";

// ---------------------------------------------------------------------------
// POST /api/properties/[id]/request-viewing
// Fallback when a property has no published slots: the authenticated user
// proposes a preferred time; the host confirms/declines from their dashboard.
// Body: { preferredTime: string (ISO), notes?: string }
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

type RpcResult = { success?: boolean; error?: string; viewing_id?: string };

export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: propertyId } = await params;

  if (!propertyId || !isUuid(propertyId)) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  let body: { preferredTime?: string; notes?: string };
  try {
    body = (await req.json()) as { preferredTime?: string; notes?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const preferredTime = body.preferredTime;
  if (!preferredTime || typeof preferredTime !== "string" || Number.isNaN(Date.parse(preferredTime))) {
    return NextResponse.json({ error: "A valid preferred time is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("request_viewing", {
    p_listing_id: propertyId,
    p_user_id: user.id,
    p_preferred_time: preferredTime,
    p_notes: body.notes ?? null,
  });

  if (error) {
    console.error("[request-viewing] RPC error:", error.message);
    return NextResponse.json({ error: "Failed to request viewing" }, { status: 500 });
  }

  const result = data as RpcResult | null;
  if (!result || result.error) {
    const code = result?.error ?? "unknown";
    if (code === "already_requested") return NextResponse.json({ error: code }, { status: 409 });
    if (code === "own_listing") return NextResponse.json({ error: code }, { status: 403 });
    if (code === "listing_not_found") return NextResponse.json({ error: code }, { status: 404 });
    return NextResponse.json({ error: code }, { status: 400 });
  }

  // Notify the host (fire-and-forget).
  void sendViewingRequestEmails({
    viewingId: result.viewing_id ?? "",
    listingId: propertyId,
    requesterId: user.id,
    preferredTime,
  });

  return NextResponse.json({ success: true, viewingId: result.viewing_id ?? null });
}
