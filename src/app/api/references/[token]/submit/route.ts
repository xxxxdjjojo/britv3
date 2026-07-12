/**
 * POST /api/references/[token]/submit
 *
 * Public, UNAUTHENTICATED referee submission. The single-use raw token in the
 * path IS the authorization — there is no session. The service hashes the token
 * and constant-time compares it, enforces single-use, and validates work dates.
 *
 * Security posture:
 *  - Rate limited 5/hour per IP, FAIL-OPEN (createRateLimiter): a legitimate
 *    referee must not be locked out by a Redis outage. The 256-bit token keyspace
 *    makes blind enumeration impractical regardless.
 *  - Body carries NO ids — only the referee's own answers. The token is the sole
 *    reference to the invitation.
 *  - The raw token is passed straight to the service and never logged.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { getClientIp } from "@/lib/request-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitReference } from "@/services/provider/reference-submission-service";

// 5 submits/hour/IP, fail-open. Narrows abuse without locking out legit referees.
const submitLimiter = createRateLimiter(5, "1 h");

const MIN_REFERENCE_TEXT = 10;
const MAX_REFERENCE_TEXT = 5000;

// Boundary validation. NO id/provider fields are accepted from the body.
const bodySchema = z.object({
  reference_text: z.string().trim().min(MIN_REFERENCE_TEXT).max(MAX_REFERENCE_TEXT),
  relationship: z.string().trim().min(1).max(200).optional(),
  work_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "work_date must be YYYY-MM-DD")
    .optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

interface RouteCtx {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await submitLimiter.limit(`ref_submit:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Please try again in a moment." }, { status: 429 });
  }

  const { token } = await ctx.params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your answers and try again." }, {
      status: 400,
    });
  }

  const result = await submitReference(createAdminClient(), token, parsed.data);

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
