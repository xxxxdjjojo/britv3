/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChainDetail } from "@/services/agent/chain-risk-service";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  try {
    const detail = await getChainDetail(supabase, groupId, user.id);
    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to fetch chain detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch chain detail" },
      { status: 500 },
    );
  }
}
