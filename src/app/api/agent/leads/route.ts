import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLeadSchema } from "@/types/agent";
import type { LeadStage } from "@/types/agent";
import {
  getAgentLeads,
  createLead,
  updateLeadStage,
  assignLead,
} from "@/services/agent/agent-lead-service";

/**
 * GET /api/agent/leads
 * Returns all leads for the authenticated agent. Accepts optional ?stage query
 * parameter to filter by pipeline stage.
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
  const stage = searchParams.get("stage") as LeadStage | null;

  try {
    const leads = await getAgentLeads(supabase, user.id, stage ?? undefined);
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Failed to fetch agent leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/leads
 * Creates a new lead for the authenticated agent. Body is validated against
 * createLeadSchema from @/types/agent.
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
    const body = (await request.json()) as unknown;
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const lead = await createLead(supabase, user.id, parsed.data);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/leads
 * Routes to either stage update or lead assignment depending on the body:
 *   { id, stage }       -> updateLeadStage
 *   { id, assigned_to } -> assignLead
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

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { id, stage, assigned_to, note } = body as {
      id?: string;
      stage?: LeadStage;
      assigned_to?: string;
      note?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Lead id is required" },
        { status: 400 },
      );
    }

    if (stage) {
      const updated = await updateLeadStage(
        supabase,
        id,
        user.id,
        stage,
        note,
      );
      return NextResponse.json(updated);
    }

    if (assigned_to) {
      const updated = await assignLead(supabase, id, user.id, assigned_to);
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Provide either stage or assigned_to to update" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to update lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 },
    );
  }
}
