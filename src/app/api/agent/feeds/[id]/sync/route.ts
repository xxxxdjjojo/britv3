/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/api/require-agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { setFeedIntegrationSyncStatus } from "@/services/agent/agent-feed-service";
import {
  createDeterministicReapitImportRun,
  getFeedImportRunReview,
} from "@/services/agent/agent-feed-import-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAgent();
  if (auth.response) {
    return auth.response;
  }

  const { id: integrationId } = await params;

  try {
    const admin = createAdminClient();
    const summary = await createDeterministicReapitImportRun(
      admin,
      auth.user.id,
      integrationId,
    );
    const review = await getFeedImportRunReview(
      admin,
      auth.user.id,
      summary.run_id,
    );
    const integration = await setFeedIntegrationSyncStatus(
      admin,
      integrationId,
      auth.user.id,
      { sync_status: "connected", last_sync_at: new Date().toISOString() },
    );

    return NextResponse.json({ integration, review, summary });
  } catch (error) {
    console.error("Failed to create feed import run:", error);
    return NextResponse.json(
      { error: "Failed to create feed import run" },
      { status: 500 },
    );
  }
}
