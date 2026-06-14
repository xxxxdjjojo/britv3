/**
 * POST /api/webhooks/gocardless
 *
 * Receives GoCardless webhooks ({ events: [...] }) and dispatches each
 * event (billing spec §1 / §5):
 *   payments confirmed    → invoice-service.recordPaymentConfirmed
 *   payments failed       → invoice-service.recordPaymentFailed
 *   payments charged_back → invoice-service.recordChargeback (freeze
 *                           auto-collection ONLY — no suspension, clause 8.6)
 *   mandates cancelled / expired / failed
 *                         → mandate-service.applyMandateEvent + inngest
 *                           'truedeed/mandate.broken' (starts the clause
 *                           8.3 10-business-day clock)
 * Unknown resource types are acknowledged with 200 and never touch the DB.
 *
 * Security:
 * - Verifies the Webhook-Signature header against the RAW body with
 *   verifyGoCardlessWebhook(GOCARDLESS_WEBHOOK_SECRET) BEFORE any parsing
 *   or DB access. Missing secret → 500; invalid signature → 498
 *   (GoCardless' documented invalid-signature status).
 *
 * Idempotency (same audit-log claim pattern as the resend route):
 * - Each GoCardless EVENT id is recorded in the truedeed_audit_log detail.
 *   A redelivered event id returns 200 without re-processing.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyGoCardlessWebhook } from "@/lib/truedeed/gocardless-client";
import {
  recordPaymentConfirmed,
  recordPaymentFailed,
  recordChargeback,
} from "@/services/truedeed/invoice-service";
import { applyMandateEvent } from "@/services/truedeed/mandate-service";
import { inngest } from "@/inngest/client";

export const dynamic = "force-dynamic";

const AUDIT_ACTION = "gocardless_webhook";

/** Invalid-signature status documented by GoCardless for webhook responses. */
const INVALID_SIGNATURE_STATUS = 498;

const MANDATE_BROKEN_ACTIONS = ["cancelled", "expired", "failed"] as const;

type GcWebhookEvent = {
  id?: string;
  resource_type?: string;
  action?: string;
  links?: { payment?: string; mandate?: string };
};

function isHandled(event: GcWebhookEvent): boolean {
  if (event.resource_type === "payments") {
    return Boolean(event.links?.payment);
  }
  if (event.resource_type === "mandates") {
    return (
      Boolean(event.links?.mandate) &&
      (MANDATE_BROKEN_ACTIONS as readonly string[]).includes(event.action ?? "")
    );
  }
  return false;
}

async function dispatchEvent(event: GcWebhookEvent): Promise<void> {
  if (event.resource_type === "payments") {
    const paymentId = event.links?.payment as string;
    if (event.action === "confirmed") {
      await recordPaymentConfirmed(paymentId);
    } else if (event.action === "failed") {
      await recordPaymentFailed(paymentId);
    } else if (event.action === "charged_back") {
      await recordChargeback(paymentId);
    }
    return;
  }

  // mandates cancelled / expired / failed — clause 8.3 clock
  const mandateId = event.links?.mandate as string;
  const applied = await applyMandateEvent({
    mandateId,
    action: event.action ?? "",
  });
  if (applied) {
    await inngest.send({
      name: "truedeed/mandate.broken",
      data: { mandateId, action: event.action },
    });
  }
}

export async function POST(request: Request) {
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Raw body — must be read before any parsing for signature verification.
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");
  if (!verifyGoCardlessWebhook(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: INVALID_SIGNATURE_STATUS },
    );
  }

  let payload: { events?: GcWebhookEvent[] };
  try {
    payload = JSON.parse(rawBody) as { events?: GcWebhookEvent[] };
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const events = Array.isArray(payload.events) ? payload.events : [];

  const supabase = createAdminClient();

  for (const event of events) {
    // Unknown resource types / malformed events: ack without touching the DB.
    if (!event?.id || !isHandled(event)) continue;

    // Idempotency claim — has this GoCardless event id been processed?
    const { data: existing, error: lookupError } = await supabase
      .from("truedeed_audit_log")
      .select("id")
      .eq("action", AUDIT_ACTION)
      .eq("detail->>event_id", event.id)
      .maybeSingle();
    if (lookupError) {
      return NextResponse.json(
        { error: "Database read failed" },
        { status: 500 },
      );
    }
    if (existing) continue;

    await dispatchEvent(event);

    const { error: auditError } = await supabase
      .from("truedeed_audit_log")
      .insert({
        action: AUDIT_ACTION,
        entity: "gocardless_events",
        entity_id: event.id,
        detail: {
          event_id: event.id,
          resource_type: event.resource_type,
          event_action: event.action,
        },
      });
    if (auditError) {
      return NextResponse.json(
        { error: "Database write failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
