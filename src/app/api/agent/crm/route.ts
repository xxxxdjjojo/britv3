/**
 * /api/agent/crm
 *
 * GET   -- list CRM clients (with optional filters) or search (?search=).
 * POST  -- create a new CRM client.
 * PATCH -- update an existing CRM client.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCrmClientSchema } from "@/types/agent";
import type { ClientType } from "@/types/agent";
import {
  getCrmClients,
  createCrmClient,
  updateCrmClient,
  searchCrmClients,
} from "@/services/agent/agent-crm-service";
import { getTeamMemberRole } from "@/services/agent/agent-team-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const search = params.get("search");

    // If a search query is provided, use dedicated search
    if (search) {
      const clients = await searchCrmClients(supabase, user.id, search);
      return NextResponse.json({ clients, count: clients.length });
    }

    // Otherwise, use filtered list
    const filters = {
      client_type: params.get("client_type") as ClientType | undefined ?? undefined,
      tags: params.get("tags")?.split(",").filter(Boolean) ?? undefined,
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    };

    const result = await getCrmClients(supabase, user.id, filters);
    return NextResponse.json({ clients: result.data, count: result.count });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch CRM clients";
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
    const parsed = createCrmClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const client = await createCrmClient(supabase, user.id, parsed.data);
    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create CRM client";
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
      [key: string]: unknown;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Client id is required" },
        { status: 400 },
      );
    }

    const { id, ...input } = body;
    const client = await updateCrmClient(supabase, id, user.id, input as Record<string, unknown>);
    return NextResponse.json({ client });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update CRM client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
