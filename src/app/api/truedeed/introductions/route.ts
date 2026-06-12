/**
 * GET /api/truedeed/introductions — the agent-facing introductions ledger.
 *
 * Auth required; only users holding the 'agent' role may list (non-agents,
 * e.g. homebuyers, get 403 — this is the agent ledger, never an applicant
 * view). Returns the same rows as /dashboard/agent/introductions.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgentIntroductions } from "@/lib/truedeed/queries";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: agentRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "agent")
      .maybeSingle();

    if (!agentRole) {
      return NextResponse.json(
        { error: "Forbidden: agent role required" },
        { status: 403 },
      );
    }

    const introductions = await getAgentIntroductions(user.id);
    return NextResponse.json({ introductions });
  } catch (err) {
    console.warn("[GET /api/truedeed/introductions] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to load introductions" },
      { status: 500 },
    );
  }
}
