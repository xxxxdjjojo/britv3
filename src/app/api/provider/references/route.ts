/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * POST /api/provider/references
 *
 * Trader-facing endpoint to request a reference (vouch) invitation.
 *
 * Auth: the CURRENT trader is authenticated via the cookie-based server client
 * (auth.getUser). The row is then written with the SERVICE-ROLE admin client,
 * because RLS blocks trader insert/update/delete on provider_references (the
 * referee-driven flow owns writes). provider_id = the auth user's id.
 *
 * On success the route emits a `provider/reference.requested` Inngest event so
 * the T7 function can generate the token + send the email. A send failure does
 * NOT fail the request — the row already exists and a resend can re-trigger.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createReferenceInvitation } from "@/services/provider/reference-invitation-service";

const bodySchema = z.object({
  referee_name: z.string().trim().min(1).max(200),
  referee_email: z.string().trim().email().max(254),
  reference_type: z.enum(["client", "peer"]),
  relationship: z.string().trim().max(500).optional(),
});

// 5 creates/hour/user — stricter than resend because each create triggers an
// email. Fails open on Redis outage; the service-level active-invite cap +
// per-invite send ceiling are the real limits, this only blunts burst abuse.
const createLimiter = createRateLimiter(5, "1 h");

export async function POST(req: Request): Promise<NextResponse> {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = await createLimiter.limit(`reference_create:${user.id}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Provider-gating: only authed users with a service_provider_details row can
  // request references. Guards against FK-violation 500s for non-providers and
  // stops non-trader accounts triggering referee emails.
  const { data: provider } = await admin
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!provider) {
    return NextResponse.json(
      { error: "Only service providers can request references." },
      { status: 403 },
    );
  }

  const result = await createReferenceInvitation(admin, {
    providerId: user.id,
    providerEmail: user.email ?? "",
    referee_name: body.referee_name,
    referee_email: body.referee_email,
    reference_type: body.reference_type,
    relationship: body.relationship,
  });

  if (!result.success) {
    const status =
      result.code === "duplicate"
        ? 409
        : result.code === "self_vouch"
          ? 422
          : result.code === "invalid"
            ? 400
            : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Fire-and-forget: emit the request event. A send failure must not fail the
  // request — the row exists and a resend can re-trigger.
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "provider/reference.requested",
      data: { referenceId: result.id },
    });
  } catch (inngestErr) {
    console.error(
      "[api/provider/references] Failed to emit provider/reference.requested",
      inngestErr,
    );
  }

  return NextResponse.json({ id: result.id }, { status: 201 });
}
