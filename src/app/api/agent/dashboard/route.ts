import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardKpis } from "@/services/agent/agent-dashboard-service";

/**
 * GET /api/agent/dashboard
 * Returns KPI metrics for the authenticated agent's dashboard.
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
    const kpis = await getAgentDashboardKpis(supabase, user.id);
    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Failed to fetch agent dashboard KPIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/dashboard
 * Upserts the agency profile for the authenticated agent.
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
    const { data, error } = await supabase
      .from("agent_agency_profiles")
      .upsert({ ...body, agent_id: user.id }, { onConflict: "agent_id" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update agency profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
