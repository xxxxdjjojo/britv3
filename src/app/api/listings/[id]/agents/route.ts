/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/uuid";
import {
  assignAgent,
  removeAgent,
  getListingAgents,
} from "@/services/listings/listing-agents-service";

// ---------------------------------------------------------------------------
// GET /api/listings/[id]/agents
// Return the actively assigned estate agents for the listing.
// RLS enforces that only the owner or an assigned agent can read.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// POST /api/listings/[id]/agents
// Assign an estate agent to the listing.
// Body: { agentId: string }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DELETE /api/listings/[id]/agents?agentId=<uuid>
// Soft-remove an estate agent representation (status → 'removed').
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

const OWNER_DENIAL_MSG = "Only the listing owner can assign an agent";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: listingId } = await params;

  if (!listingId || !isUuid(listingId)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const agents = await getListingAgents(supabase, listingId);
    return NextResponse.json(agents);
  } catch (err) {
    console.error("[listing-agents] GET error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch listing agents" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: listingId } = await params;

  if (!listingId || !isUuid(listingId)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { agentId?: unknown };
  try {
    body = (await request.json()) as { agentId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { agentId } = body;
  if (typeof agentId !== "string" || !isUuid(agentId)) {
    return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });
  }

  // Defense-in-depth PII guard: confirm the target user is an estate agent.
  // Assigning a non-agent would grant them viewing access including buyer names.
  // user_roles SELECT RLS is owner-only, so an owner querying another user's
  // roles gets [] — validate via the SECURITY DEFINER RPC, which works
  // cross-user and returns only a boolean.
  const { data: isAgent, error: roleError } = await supabase.rpc(
    "is_estate_agent",
    { p_user_id: agentId },
  );

  if (roleError) {
    console.error("[listing-agents] role check error:", roleError.message);
    return NextResponse.json({ error: "Failed to assign agent" }, { status: 500 });
  }

  if (!isAgent) {
    return NextResponse.json(
      { error: "Selected user is not an estate agent" },
      { status: 400 },
    );
  }

  try {
    await assignAgent(supabase, { listingId, agentId, createdBy: user.id });
    const agents = await getListingAgents(supabase, listingId);
    return NextResponse.json(agents);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === OWNER_DENIAL_MSG) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error("[listing-agents] POST error:", msg);
    return NextResponse.json({ error: "Failed to assign agent" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id: listingId } = await params;

  if (!listingId || !isUuid(listingId)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Accept agentId from query string or JSON body
  const urlSearchParams = new URL(request.url).searchParams;
  let agentId: string | null = urlSearchParams.get("agentId");

  if (!agentId) {
    try {
      const body = (await request.json()) as { agentId?: unknown };
      if (typeof body.agentId === "string") {
        agentId = body.agentId;
      }
    } catch {
      // No body — fall through to validation below
    }
  }

  if (!agentId || !isUuid(agentId)) {
    return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });
  }

  try {
    await removeAgent(supabase, { listingId, agentId });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === OWNER_DENIAL_MSG) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error("[listing-agents] DELETE error:", msg);
    return NextResponse.json({ error: "Failed to remove agent" }, { status: 500 });
  }
}
