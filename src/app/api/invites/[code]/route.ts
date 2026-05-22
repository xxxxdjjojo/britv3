// src/app/api/invites/[code]/route.ts
//
// Memo Pivot v2 — invite code validation + redemption endpoint.

import { NextResponse, type NextRequest } from "next/server";

import { createRateLimiter } from "@/lib/cache/redis";
import { createClient } from "@/lib/supabase/server";
import { redeemInviteCode, validateInviteCode } from "@/lib/invite-codes";

// 60 GET/min/IP — anonymous validation lookup. Narrows brute-force
// enumeration of invite codes. Fails open on Redis outage; the 8-char
// alphanumeric keyspace (~2.8T) still makes blind brute force impractical.
const inviteValidateLimiter = createRateLimiter(60, "1 m");

interface RouteCtx {
  params: Promise<{ code: string }>;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = await inviteValidateLimiter.limit(`invite_validate:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

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
