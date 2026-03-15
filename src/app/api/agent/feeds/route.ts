import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FeedProvider, SyncStatus } from "@/types/agent";
import {
  getFeedIntegrations,
  createFeedIntegration,
  updateFeedIntegration,
  deleteFeedIntegration,
  getFeedSyncStatus,
} from "@/services/agent/agent-feed-service";

/**
 * GET /api/agent/feeds
 *
 * Returns all feed integrations for the authenticated agent.
 * Pass ?id=<integrationId>&status=true to get sync status only.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const statusOnly = searchParams.get("status") === "true";

  try {
    if (id && statusOnly) {
      const status = await getFeedSyncStatus(supabase, id, user.id);
      return NextResponse.json(status);
    }

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
 * Creates a new feed integration.
 * Body: { provider: FeedProvider, api_key: string, field_mapping?: object }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { provider, api_key, field_mapping } = body as {
      provider?: FeedProvider;
      api_key?: string;
      field_mapping?: Record<string, unknown>;
    };

    if (!provider || !api_key) {
      return NextResponse.json(
        { error: "provider and api_key are required" },
        { status: 400 },
      );
    }

    const integration = await createFeedIntegration(supabase, user.id, {
      provider,
      api_key,
      field_mapping,
    });

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
 * PATCH /api/agent/feeds?id=<integrationId>
 * Updates an existing feed integration.
 * Body: { api_key?, webhook_url?, field_mapping?, sync_status? }
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { api_key, webhook_url, field_mapping, sync_status } = body as {
      api_key?: string;
      webhook_url?: string | null;
      field_mapping?: Record<string, unknown>;
      sync_status?: SyncStatus;
    };

    const integration = await updateFeedIntegration(supabase, id, user.id, {
      api_key,
      webhook_url,
      field_mapping,
      sync_status,
    });

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
 * DELETE /api/agent/feeds?id=<integrationId>
 * Permanently deletes a feed integration.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 },
    );
  }

  try {
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
