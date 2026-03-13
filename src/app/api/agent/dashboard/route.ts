/**
 * GET /api/agent/dashboard -- fetch estate agent dashboard KPIs.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgentDashboardKpis } from "@/services/agent/agent-dashboard-service";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kpis = await getAgentDashboardKpis(supabase, user.id);
    return NextResponse.json({ kpis });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
