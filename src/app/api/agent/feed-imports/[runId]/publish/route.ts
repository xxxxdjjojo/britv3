/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/api/require-agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishApprovedFeedImportRunItems } from "@/services/agent/agent-feed-import-service";

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAgent();
  if (auth.response) {
    return auth.response;
  }

  const { runId } = await params;

  try {
    const result = await publishApprovedFeedImportRunItems(
      createAdminClient(),
      auth.user.id,
      runId,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to publish feed import items:", error);
    return NextResponse.json(
      { error: "Failed to publish feed import items" },
      { status: 500 },
    );
  }
}
