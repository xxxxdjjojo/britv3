/**
 * POST /api/webhooks/resend
 *
 * Receives Resend delivery webhooks (svix-signed) and reflects delivery /
 * bounce outcomes onto email_logs — the "did the dispute-killer email land"
 * half of the Truedeed introduction ledger.
 *
 * Security:
 * - Verifies the svix signature (RESEND_WEBHOOK_SECRET) against the RAW
 *   request body via @/lib/email/resend-webhook-verifier BEFORE touching
 *   the payload or the database. 500 when the secret is unset, 400 on a
 *   bad signature — no DB access on either path.
 *
 * Idempotency (Stripe-webhook claim pattern, simpler claim):
 * - Each event's svix-id is recorded in the truedeed_audit_log detail.
 *   A redelivery whose svix-id already has an audit row returns 200
 *   without writing anything.
 *
 * Reliability:
 * - Unknown event types are acked with 200 so Resend retries don't pile up.
 * - DB write failures return 500 so Resend redelivers.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyResendWebhook } from "@/lib/email/resend-webhook-verifier";

export const dynamic = "force-dynamic";

const AUDIT_ACTION = "resend_webhook";

const STATUS_BY_EVENT_TYPE: Record<string, string> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
};

type ResendWebhookEvent = {
  type?: string;
  data?: { email_id?: string };
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Raw body — must be read before any parsing for signature verification.
  const rawBody = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") ?? undefined,
    "svix-timestamp": request.headers.get("svix-timestamp") ?? undefined,
    "svix-signature": request.headers.get("svix-signature") ?? undefined,
  };

  if (!verifyResendWebhook(rawBody, svixHeaders, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const svixId = svixHeaders["svix-id"];
  if (!svixId) {
    return NextResponse.json({ error: "Missing svix-id" }, { status: 400 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const status = event.type ? STATUS_BY_EVENT_TYPE[event.type] : undefined;
  const resendId = event.data?.email_id;
  if (!status || !resendId) {
    // Unknown event types are acknowledged without writes.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const supabase = createAdminClient();

  // Idempotency claim — has this svix-id already been processed?
  const { data: existing, error: lookupError } = await supabase
    .from("truedeed_audit_log")
    .select("id")
    .eq("action", AUDIT_ACTION)
    .eq("detail->>svix_id", svixId)
    .maybeSingle();
  if (lookupError) {
    return NextResponse.json({ error: "Database read failed" }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  const { error: updateError } = await supabase
    .from("email_logs")
    .update({ status })
    .eq("resend_id", resendId);
  if (updateError) {
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("truedeed_audit_log").insert({
    action: AUDIT_ACTION,
    entity: "email_logs",
    entity_id: resendId,
    detail: { svix_id: svixId, event_type: event.type, status },
  });
  if (auditError) {
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
