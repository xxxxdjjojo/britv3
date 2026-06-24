/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/api/require-agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveEligibleFeedImportRunItems } from "@/services/agent/agent-feed-import-service";

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAgent();
  if (auth.response) {
    return auth.response;
  }

  const { runId } = await params;

  try {
    const review = await approveEligibleFeedImportRunItems(
      createAdminClient(),
      auth.user.id,
      runId,
    );

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Failed to approve feed import items:", error);
    return NextResponse.json(
      { error: "Failed to approve feed import items" },
      { status: 500 },
    );
  }
}
