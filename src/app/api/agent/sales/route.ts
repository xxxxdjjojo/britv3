/**
 * /api/agent/sales
 *
 * GET   -- list sale progressions for the authenticated agent.
 * PATCH -- update a sale progression stage (validates allowed transitions).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SaleStage } from "@/types/agent";
import {
  getAgentSaleProgressions,
  updateSaleStage,
} from "@/services/agent/agent-sale-service";
import { getTeamMemberRole } from "@/services/agent/agent-team-service";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progressions = await getAgentSaleProgressions(supabase, user.id);
    return NextResponse.json({ progressions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch sale progressions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = request.nextUrl.searchParams.get("agent_id") ?? user.id;
    const role = await getTeamMemberRole(supabase, agentId, user.id);
    if (role === null || role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      id?: string;
      stage?: SaleStage;
      notes?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Sale progression id is required" },
        { status: 400 },
      );
    }

    if (!body.stage) {
      return NextResponse.json(
        { error: "Target stage is required" },
        { status: 400 },
      );
    }

    const progression = await updateSaleStage(
      supabase,
      body.id,
      user.id,
      body.stage,
      body.notes,
    );

    return NextResponse.json({ progression });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update sale stage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
