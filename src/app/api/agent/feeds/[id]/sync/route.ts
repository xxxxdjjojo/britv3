/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/api/require-agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { setFeedIntegrationSyncStatus } from "@/services/agent/agent-feed-service";
import { getFeedImportRunReview } from "@/services/agent/agent-feed-import-service";
import { runConnectorImport } from "@/services/connectors/run-import";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAgent();
  if (auth.response) {
    return auth.response;
  }

  const { id: integrationId } = await params;

  // Optional body fields: payload (CSV text / XML) and fieldMapping for CSV/generic_feed.
  // reapit/sandbox ignore both — parsing JSON on every request is cheap and safe.
  let payload: string | undefined;
  let fieldMapping: Record<string, string> | undefined;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.payload === "string") {
      payload = body.payload;
    }
    if (
      body.fieldMapping != null &&
      typeof body.fieldMapping === "object" &&
      !Array.isArray(body.fieldMapping)
    ) {
      // Coerce to string→string: drop entries where the value is not a string.
      const raw = body.fieldMapping as Record<string, unknown>;
      const coerced: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "string") {
          coerced[k] = v;
        }
      }
      fieldMapping = coerced;
    }
  } catch {
    // No body or non-JSON body — fine for reapit/sandbox which need neither.
  }

  try {
    const admin = createAdminClient();
    const importResult = await runConnectorImport(
      admin,
      auth.user.id,
      integrationId,
      { payload, fieldMapping },
    );

    if (importResult.blocked) {
      // Empty-feed guard triggered: do NOT set sync_status to connected.
      // The service already stamped sync_status=error + error_log.
      return NextResponse.json(
        {
          blocked: importResult.blocked,
          summary: importResult.summary,
          errors: importResult.errors,
        },
        { status: 409 },
      );
    }

    const review = await getFeedImportRunReview(
      admin,
      auth.user.id,
      importResult.summary.run_id,
    );
    const integration = await setFeedIntegrationSyncStatus(
      admin,
      integrationId,
      auth.user.id,
      { sync_status: "connected", last_sync_at: new Date().toISOString() },
    );

    return NextResponse.json({
      integration,
      review,
      summary: importResult.summary,
      errors: importResult.errors,
    });
  } catch (error) {
    console.error("Failed to create feed import run:", error);
    return NextResponse.json(
      { error: "Failed to create feed import run" },
      { status: 500 },
    );
  }
}
