/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * POST /api/provider/references/[id]/resend
 *
 * Trader-facing endpoint to resend a pending/sent reference invitation.
 *
 * Auth via the cookie-based server client; eligibility + write path use the
 * SERVICE-ROLE admin client (RLS blocks trader writes). The service validates
 * resend eligibility only — the token rotation + email happen in the T7 Inngest
 * function, triggered by the `provider/reference.resend-requested` event.
 *
 * A light HTTP-layer rate limit (10/min per user) blunts resend spam on top of
 * the service-level cooldown + max-sends guards.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resendReferenceInvitation } from "@/services/provider/reference-invitation-service";
import { getVouchRules } from "@/services/provider/vouch-rules-service";

type Params = Promise<{ id: string }>;

// 10 resends/min/user — fails open on Redis outage. The service-level cooldown
// and max-sends ceiling are the real limits; this only caps burst spam.
const resendLimiter = createRateLimiter(10, "1 m");

export async function POST(
  _req: Request,
  { params }: { params: Params },
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await resendLimiter.limit(`reference_resend:${user.id}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Reject non-UUID ids before hitting the DB; 404 so we never leak existence.
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const rules = await getVouchRules(admin);
  const result = await resendReferenceInvitation(admin, {
    referenceId: id,
    providerId: user.id,
    rules,
  });

  if (!result.success) {
    const status =
      result.code === "cooldown" || result.code === "max_sends"
        ? 429
        : result.code === "not_resendable"
          ? 409
          : result.code === "not_found"
            ? 404
            : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Fire-and-forget: a send failure must not fail the request.
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "provider/reference.resend-requested",
      data: { referenceId: id },
    });
  } catch (inngestErr) {
    console.error(
      "[api/provider/references/resend] Failed to emit provider/reference.resend-requested",
      inngestErr,
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
