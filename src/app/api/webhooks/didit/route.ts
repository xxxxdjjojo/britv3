/**
 * POST /api/webhooks/didit
 *
 * Didit verification webhooks (status.updated / data.updated). Unauthenticated
 * — trust comes solely from the HMAC signature over the RAW body, verified
 * BEFORE any parsing or DB access (401 on mismatch, 500 when the secret is
 * unset so a misconfigured deploy is loud).
 *
 * Writes are absolute-state and scoped to the profile whose kyc_provider_ref
 * equals this event's session_id — replays and events for superseded sessions
 * match zero rows and are acked without effect (idempotency). Unknown
 * statuses/sessions are acked with 200 so Didit does not retry; DB failures
 * return 500 so it does.
 */

import { NextResponse } from "next/server";
import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDiditWebhook } from "@/lib/verification/didit-webhook-verifier";
import { mapDiditStatus } from "@/services/verification/didit-status-map";

export const dynamic = "force-dynamic";

type DiditWebhookPayload = Readonly<{
  session_id?: string;
  status?: string;
  vendor_data?: string;
}>;

export async function POST(request: Request) {
  const secret = env.DIDIT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const isValid = verifyDiditWebhook(
    rawBody,
    request.headers.get("x-signature"),
    request.headers.get("x-timestamp"),
    secret,
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: DiditWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DiditWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sessionId = payload.session_id;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const kycStatus = mapDiditStatus(payload.status);
  if (!kycStatus) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("profiles")
    .update({ kyc_status: kycStatus })
    .eq("kyc_provider_ref", sessionId);
  if (payload.vendor_data) {
    query = query.eq("id", payload.vendor_data);
  }
  const { data, error } = await query.select("id");

  if (error) {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, matched: (data ?? []).length > 0 }, { status: 200 });
}
