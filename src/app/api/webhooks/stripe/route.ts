/**
 * POST /api/webhooks/stripe
 *
 * Receives and processes Stripe webhook events for both:
 * - Platform billing (subscriptions, invoices, refunds)
 * - Provider Connect (payouts, account updates, payment intents)
 *
 * Security:
 * - Validates Stripe-Signature header before touching payload.
 * - Uses raw body (not parsed JSON) for signature verification.
 *
 * Idempotency:
 * - claim_billing_event atomically claims or re-opens billing_events rows.
 * - Already-processed duplicate events return 200 immediately (no-op).
 *
 * Reliability:
 * - Returns 500 on DB write failure so Stripe retries delivery.
 * - Returns 200 for unknown event types (don't break Stripe retries).
 *
 * Dispatch logic lives in `src/services/billing/stripe-event-processor.ts`
 * so the DLQ replay function can re-run the same code with a stored payload.
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { captureException } from "@/lib/observability/capture-exception";
import { processStripeEvent } from "@/services/billing/stripe-event-processor";
import {
  type BillingEventClaim,
  claimBillingEvent,
  markBillingEventFailed,
  markBillingEventProcessed,
} from "@/services/billing/billing-events";

export const dynamic = "force-dynamic";

/**
 * Service-role Supabase client for webhook writes.
 * Uses service role key — bypasses RLS so we can write to subscriptions table.
 */
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Read raw body — must happen before any other body consumption
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  let claim: BillingEventClaim;
  try {
    claim = await claimBillingEvent(supabase, event);
  } catch (claimError) {
    captureException(claimError, {
      module: "billing",
      feature: "stripe-webhook",
      operation: "claim_billing_event",
      extra: { eventId: event.id, eventType: event.type },
    });
    console.error("[webhook] Idempotency claim error:", claimError);
    return NextResponse.json({ error: "Database write failed" }, { status: 500 });
  }

  if (!claim.should_process) {
    console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ─── Event dispatch ──────────────────────────────────────────────────────
  try {
    const { userId } = await processStripeEvent(supabase, stripe, event);

    await markBillingEventProcessed(supabase, event, userId);

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    captureException(err, {
      module: "billing",
      feature: "stripe-webhook",
      operation: "handle-event",
      extra: { eventId: event.id, eventType: event.type },
    });
    await markBillingEventFailed(supabase, event, err);
    console.error("[api/webhooks/stripe] error:", event.id, err);

    // Emit to Inngest DLQ for retry
    try {
      const { inngest } = await import("@/inngest/client");
      await inngest.send({
        name: "billing/webhook.handler_failed",
        data: {
          eventId: event.id,
          eventType: event.type,
          errorMessage,
          payload: event.data.object as unknown as Record<string, unknown>,
          attempt: 1,
        },
      });
    } catch (inngestErr) {
      console.error("[webhook] Failed to emit DLQ event:", inngestErr);
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
