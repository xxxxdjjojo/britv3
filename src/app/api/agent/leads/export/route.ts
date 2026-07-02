import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureException } from "@/lib/observability/capture-exception";
import { posthogServer } from "@/lib/analytics/posthog-server";
import {
  buildLeadsCsv,
  getLeadsForExport,
} from "@/services/agent/agent-lead-export-service";

/**
 * GET /api/agent/leads/export
 *
 * "Your Data, Your Leads" (Influence Campaign 45): downloads every lead the
 * authenticated agent owns as a CSV attachment. Uses the session-bound
 * Supabase client so RLS (agent_id = auth.uid()) scopes the export — the
 * same auth pattern as the neighbouring /api/agent/leads routes.
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
    const leads = await getLeadsForExport(supabase, user.id);
    const csv = buildLeadsCsv(leads);
    const date = new Date().toISOString().slice(0, 10);

    // Audit trail: server-side analytics event, same mechanism as
    // /api/experiments/exposure. Must never block or fail the export.
    try {
      posthogServer?.capture?.({
        event: "agent_leads_exported",
        distinctId: user.id,
        properties: { user_id: user.id, row_count: leads.length },
      });
    } catch {
      // Analytics must never break the export
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="truedeed-leads-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    captureException(error, {
      module: "agent-leads",
      route: "/api/agent/leads/export",
      operation: "export_csv",
    });
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 },
    );
  }
}
