/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/uuid";
import { sendViewingBookedEmails } from "@/services/viewings/viewing-notifications";

// ---------------------------------------------------------------------------
// POST /api/viewings/requests/[id]
// Host confirms or declines a pending viewing request.
// Body: { action: "confirm" | "decline", slotId?: string }
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

type RpcResult = {
  success?: boolean;
  error?: string;
  action?: string;
};

export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: viewingId } = await params;

  if (!viewingId || !isUuid(viewingId)) {
    return NextResponse.json({ error: "Invalid viewing id" }, { status: 400 });
  }

  let body: { action?: string; slotId?: string };
  try {
    body = (await req.json()) as { action?: string; slotId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, slotId } = body;
  if (action !== "confirm" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Read the request's listing/booker before responding — the listing owner can
  // read viewings on their listing under RLS. Used for the confirmation email.
  const { data: viewingRow } = await supabase
    .from("viewings")
    .select("listing_id, user_id")
    .eq("id", viewingId)
    .maybeSingle();

  const { data, error } = await supabase.rpc("respond_viewing_request", {
    p_viewing_id: viewingId,
    p_action: action,
    p_slot_id: slotId ?? null,
  });

  if (error) {
    console.error("[viewing-requests] RPC error:", error.message);
    return NextResponse.json({ error: "Failed to respond to request" }, { status: 500 });
  }

  const result = data as RpcResult | null;
  if (!result || result.error) {
    const code = result?.error ?? "unknown";
    if (code === "not_found") return NextResponse.json({ error: code }, { status: 404 });
    if (code === "forbidden") return NextResponse.json({ error: code }, { status: 403 });
    if (code === "slot_taken") return NextResponse.json({ error: code }, { status: 409 });
    return NextResponse.json({ error: code }, { status: 400 });
  }

  // On confirm-with-slot, send the booker a confirmation (fire-and-forget).
  const row = viewingRow as { listing_id: string; user_id: string } | null;
  if (action === "confirm" && slotId && row) {
    void sendViewingBookedEmails({
      viewingId,
      slotId,
      listingId: row.listing_id,
      bookerId: row.user_id,
    });
  }

  return NextResponse.json({ success: true, action: result.action ?? action });
}
