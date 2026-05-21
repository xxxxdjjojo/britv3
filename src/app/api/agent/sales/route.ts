/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentSaleProgressions,
  updateSaleStage,
} from "@/services/agent/agent-sale-service";
import type { SaleStage } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";

/**
 * GET /api/agent/sales
 * Returns all sale progressions for the authenticated agent.
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
    const progressions = await getAgentSaleProgressions(supabase, user.id);
    return NextResponse.json(progressions);
  } catch (error) {
    console.error("Failed to fetch sale progressions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale progressions" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/sales
 * Updates the stage of a sale progression.
 * Body: { id: string; stage: SaleStage; notes?: string }
 * Returns 400 if the stage transition is invalid.
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
    const body = (await request.json()) as unknown;
    const { id, stage, notes } = body as {
      id?: string;
      stage?: string;
      notes?: string;
    };

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      );
    }

    if (!stage || !SALE_STAGES.includes(stage as SaleStage)) {
      return NextResponse.json(
        { error: `stage must be one of: ${SALE_STAGES.join(", ")}` },
        { status: 400 },
      );
    }

    const updated = await updateSaleStage(
      supabase,
      id,
      user.id,
      stage as SaleStage,
      notes,
    );

    return NextResponse.json(updated);
  } catch (error) {
    // updateSaleStage throws on invalid transitions — surface as 400
    const message =
      error instanceof Error ? error.message : "Failed to update sale stage";
    const isTransitionError = message.includes("Invalid stage transition");
    return NextResponse.json(
      { error: message },
      { status: isTransitionError ? 400 : 500 },
    );
  }
}
