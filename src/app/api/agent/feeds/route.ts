/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getFeedIntegrations,
  createFeedIntegration,
  updateFeedIntegration,
  deleteFeedIntegration,
} from "@/services/agent/agent-feed-service";
import { FEED_PROVIDERS } from "@/types/agent";

const fieldMappingSchema = z.record(z.string(), z.string());

const createFeedIntegrationSchema = z
  .object({
    provider: z.enum(FEED_PROVIDERS),
    api_key: z.string().trim().min(8),
    field_mapping: fieldMappingSchema.optional(),
  })
  .strict();

const updateFeedIntegrationSchema = z
  .object({
    id: z.string().uuid(),
    api_key: z.string().trim().min(8).optional(),
    field_mapping: fieldMappingSchema.optional(),
  })
  .strict()
  .refine((input) => input.api_key !== undefined || input.field_mapping !== undefined, {
    message: "At least one update field is required",
  });

type AgentApiContext = {
  supabase: SupabaseClient;
  user: User;
};

type AgentApiGuardResult =
  | { ok: true; context: AgentApiContext }
  | { ok: false; response: NextResponse };

async function requireAgentUser(): Promise<AgentApiGuardResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.active_role !== "agent") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, context: { supabase, user } };
}

function redactFeedIntegration<T>(integration: T): Omit<T, "api_key_encrypted"> {
  const { api_key_encrypted: _apiKeyEncrypted, ...safeIntegration } =
    integration as T & { api_key_encrypted?: unknown };

  return safeIntegration;
}

function jsonValidationError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid feed integration payload",
      details: error.flatten(),
    },
    { status: 400 },
  );
}

/**
 * GET /api/agent/feeds
 * Returns all feed integrations for the authenticated agent.
 */
export async function GET() {
  const guard = await requireAgentUser();
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { supabase, user } = guard.context;
    const integrations = await getFeedIntegrations(supabase, user.id);
    return NextResponse.json(integrations.map(redactFeedIntegration));
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
  const guard = await requireAgentUser();
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await request.json();
    const parsed = createFeedIntegrationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { supabase, user } = guard.context;
    const integration = await createFeedIntegration(supabase, user.id, parsed.data);
    return NextResponse.json(redactFeedIntegration(integration), { status: 201 });
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
  const guard = await requireAgentUser();
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await request.json();
    const parsed = updateFeedIntegrationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { id, ...updates } = parsed.data;
    const { supabase, user } = guard.context;
    const integration = await updateFeedIntegration(
      supabase,
      id,
      user.id,
      updates,
    );
    return NextResponse.json(redactFeedIntegration(integration));
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
  const guard = await requireAgentUser();
  if (!guard.ok) {
    return guard.response;
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

    const { supabase, user } = guard.context;
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
