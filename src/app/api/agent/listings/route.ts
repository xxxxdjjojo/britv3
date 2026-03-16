/**
 * /api/agent/listings
 *
 * GET   -- list agent listings, optional ?status= &page= &limit= &sortBy= filters.
 * POST  -- create a new listing.
 * PATCH -- update, archive, or restore a listing based on body.action.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentListings,
  createAgentListing,
  updateAgentListing,
  archiveListing,
  restoreListing,
} from "@/services/agent/agent-listings-service";
import { getTeamMemberRole } from "@/services/agent/agent-team-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status") ?? undefined;
    const page = parseInt(params.get("page") ?? "1", 10);
    const limit = parseInt(params.get("limit") ?? "20", 10);
    const sortBy = params.get("sortBy") ?? undefined;

    const result = await getAgentListings(supabase, user.id, {
      status,
      page,
      limit,
      sortBy,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch listings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = request.nextUrl.searchParams.get("agent_id") ?? user.id;
    const role = await getTeamMemberRole(supabase, agentId, user.id);
    if (role === null || role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const listing = await createAgentListing(supabase, user.id, body);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = request.nextUrl.searchParams.get("agent_id") ?? user.id;
    const role = await getTeamMemberRole(supabase, agentId, user.id);
    if (role === null || role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      id?: string;
      action?: "update" | "archive" | "restore";
      data?: Record<string, unknown>;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Listing id is required" },
        { status: 400 },
      );
    }

    if (body.action === "archive") {
      const listing = await archiveListing(supabase, body.id, user.id);
      return NextResponse.json({ listing });
    }

    if (body.action === "restore") {
      const listing = await restoreListing(supabase, body.id, user.id);
      return NextResponse.json({ listing });
    }

    if (body.action === "update" && body.data) {
      const listing = await updateAgentListing(
        supabase,
        body.id,
        user.id,
        body.data,
      );
      return NextResponse.json({ listing });
    }

    return NextResponse.json(
      { error: "Provide a valid action (update, archive, restore)" },
      { status: 400 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
