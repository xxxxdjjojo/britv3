/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addLeadActivity } from "@/services/agent/agent-lead-service";

/**
 * POST /api/agent/leads/activities
 * Adds a new activity (e.g. note) to a lead's timeline.
 * Body: { lead_id, activity_type, description }
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
    const { lead_id, activity_type, description } = body as {
      lead_id?: string;
      activity_type?: string;
      description?: string;
    };

    if (!lead_id || !activity_type) {
      return NextResponse.json(
        { error: "lead_id and activity_type are required" },
        { status: 400 },
      );
    }

    // Verify the lead belongs to this agent before adding activity
    const { data: lead, error: leadError } = await supabase
      .from("agent_leads")
      .select("id")
      .eq("id", lead_id)
      .eq("agent_id", user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const activity = await addLeadActivity(
      supabase,
      lead_id,
      user.id,
      activity_type,
      description ?? "",
    );

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Failed to add lead activity:", error);
    return NextResponse.json(
      { error: "Failed to add activity" },
      { status: 500 },
    );
  }
}
