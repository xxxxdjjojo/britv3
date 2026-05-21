/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getFeedIntegrations,
  createFeedIntegration,
  updateFeedIntegration,
  deleteFeedIntegration,
} from "@/services/agent/agent-feed-service";

/**
 * GET /api/agent/feeds
 * Returns all feed integrations for the authenticated agent.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const integrations = await getFeedIntegrations(supabase, user.id);
    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Failed to fetch feed integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed integrations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/feeds
 * Create a new feed integration.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const integration = await createFeedIntegration(supabase, user.id, body);
    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Failed to create feed integration:", error);
    return NextResponse.json(
      { error: "Failed to create feed integration" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/feeds
 * Update a feed integration. Requires id in request body.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const integration = await updateFeedIntegration(
      supabase,
      id,
      user.id,
      updates,
    );
    return NextResponse.json(integration);
  } catch (error) {
    console.error("Failed to update feed integration:", error);
    return NextResponse.json(
      { error: "Failed to update feed integration" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agent/feeds?id=xxx
 * Hard-delete a feed integration.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 },
      );
    }

    await deleteFeedIntegration(supabase, id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feed integration:", error);
    return NextResponse.json(
      { error: "Failed to delete feed integration" },
      { status: 500 },
    );
  }
}
