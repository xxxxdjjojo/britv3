/**
 * /api/agent/feeds
 *
 * GET    -- list feed integrations or get sync status (?id=&type=status).
 * POST   -- create a new feed integration.
 * PATCH  -- update a feed integration.
 * DELETE -- delete a feed integration.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getFeedIntegrations,
  createFeedIntegration,
  updateFeedIntegration,
  deleteFeedIntegration,
  getFeedSyncStatus,
} from "@/services/agent/agent-feed-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const id = params.get("id");
    const type = params.get("type");

    if (id && type === "status") {
      const status = await getFeedSyncStatus(supabase, id, user.id);
      return NextResponse.json({ status });
    }

    const integrations = await getFeedIntegrations(supabase, user.id);
    return NextResponse.json({ integrations });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch feed integrations";
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

    const body = (await request.json()) as {
      provider?: string;
      api_key?: string;
      field_mapping?: Record<string, string>;
    };

    if (!body.provider || !body.api_key) {
      return NextResponse.json(
        { error: "provider and api_key are required" },
        { status: 400 },
      );
    }

    const integration = await createFeedIntegration(supabase, user.id, {
      provider: body.provider,
      api_key: body.api_key,
      field_mapping: body.field_mapping,
    });
    return NextResponse.json({ integration }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create feed integration";
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

    const body = (await request.json()) as {
      id?: string;
      [key: string]: unknown;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Integration id is required" },
        { status: 400 },
      );
    }

    const { id, ...input } = body;
    const integration = await updateFeedIntegration(
      supabase,
      id,
      user.id,
      input as Partial<{
        provider: string;
        api_key: string;
        field_mapping: Record<string, string>;
        sync_status: string;
      }>,
    );
    return NextResponse.json({ integration });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update feed integration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { error: "Integration id is required" },
        { status: 400 },
      );
    }

    await deleteFeedIntegration(supabase, body.id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to delete feed integration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
