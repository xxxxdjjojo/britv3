/**
 * POST /api/references/[token]/decline
 *
 * Public, UNAUTHENTICATED referee decline. The single-use raw token in the path
 * IS the authorization. Declining a reference is a legitimate, non-abusive
 * action; a reason is OPTIONAL. Same security posture as the submit route:
 * rate limited 5/hour per IP (fail-open), body carries NO ids, token never
 * logged.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { getClientIp } from "@/lib/request-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { declineReference } from "@/services/provider/reference-submission-service";

const declineLimiter = createRateLimiter(5, "1 h");

const MAX_REASON = 1000;

const bodySchema = z.object({
  reason: z.string().trim().max(MAX_REASON).optional(),
});

interface RouteCtx {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await declineLimiter.limit(`ref_decline:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Please try again in a moment." }, { status: 429 });
  }

  const { token } = await ctx.params;

  // An empty/absent body is valid — a reason is optional.
  let raw: unknown = {};
  try {
    const text = await req.text();
    if (text) raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await declineReference(createAdminClient(), token, parsed.data.reason);

  if (result.success) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  switch (result.state) {
    case "used":
      return NextResponse.json({ error: result.error }, { status: 409 });
    case "expired":
      return NextResponse.json({ error: result.error }, { status: 410 });
    case "invalid":
      return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
    default:
      return NextResponse.json({ error: result.error }, { status: 400 });
  }
}
