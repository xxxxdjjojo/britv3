import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentSaleProgressions,
  updateSaleStage,
} from "@/services/agent/agent-sale-service";
import { SALE_STAGES } from "@/types/agent";
import type { SaleStage } from "@/types/agent";

/**
 * GET /api/agent/sales
 *
 * Returns all active sale progressions for the authenticated agent.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progressions = await getAgentSaleProgressions(supabase, user.id);

    return NextResponse.json({ progressions });
  } catch (error) {
    console.error("GET /api/agent/sales error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/sales
 *
 * Update the stage (and optionally notes) of a sale progression.
 * Body: { id: string, stage: SaleStage, notes?: string }
 *
 * Returns 422 if the transition is invalid (adjacent-only rule).
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      );
    }

    const stageParam = body.stage;
    if (
      !stageParam ||
      typeof stageParam !== "string" ||
      !(SALE_STAGES as readonly string[]).includes(stageParam)
    ) {
      return NextResponse.json(
        { error: `stage must be one of: ${SALE_STAGES.join(", ")}` },
        { status: 400 },
      );
    }

    const notes =
      typeof body.notes === "string" ? body.notes : undefined;

    const progression = await updateSaleStage(
      supabase,
      body.id,
      user.id,
      stageParam as SaleStage,
      notes,
    );

    return NextResponse.json({ progression });
  } catch (error) {
    console.error("PATCH /api/agent/sales error:", error);

    if (error instanceof Error && error.message.includes("Invalid stage transition")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
