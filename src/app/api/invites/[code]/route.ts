// src/app/api/invites/[code]/route.ts
//
// Memo Pivot v2 — invite code validation + redemption endpoint.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { redeemInviteCode, validateInviteCode } from "@/lib/invite-codes";

interface RouteCtx {
  params: Promise<{ code: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const { code } = await ctx.params;
  const result = await validateInviteCode(code);
  if (!result) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
  }
  return NextResponse.json(result);
}

export async function POST(_req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const { code } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }
  try {
    const result = await redeemInviteCode(code, user.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "redemption_failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
