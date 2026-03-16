/**
 * /api/agent/leads
 *
 * GET   -- list leads, optional ?stage= filter.
 * POST  -- create a new lead (validates with createLeadSchema).
 * PATCH -- update lead stage or assign to a team member.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLeadSchema } from "@/types/agent";
import type { LeadStage } from "@/types/agent";
import {
  getAgentLeads,
  createLead,
  updateLeadStage,
  assignLead,
} from "@/services/agent/agent-lead-service";
import { getTeamMemberRole } from "@/services/agent/agent-team-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stage = request.nextUrl.searchParams.get("stage") as
      | LeadStage
      | null;

    const leads = await getAgentLeads(
      supabase,
      user.id,
      stage ?? undefined,
    );
    return NextResponse.json({ leads });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch leads";
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
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const lead = await createLead(supabase, user.id, parsed.data);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create lead";
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
      stage?: LeadStage;
      assignee_id?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Lead id is required" },
        { status: 400 },
      );
    }

    // Route to the appropriate operation
    if (body.stage) {
      const lead = await updateLeadStage(
        supabase,
        body.id,
        user.id,
        body.stage,
      );
      return NextResponse.json({ lead });
    }

    if (body.assignee_id) {
      const lead = await assignLead(
        supabase,
        body.id,
        user.id,
        body.assignee_id,
      );
      return NextResponse.json({ lead });
    }

    return NextResponse.json(
      { error: "Provide either stage or assignee_id" },
      { status: 400 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
