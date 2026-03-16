/**
 * Stripe Webhook Handler
 *
 * Receives Stripe webhook events, verifies the signature, and routes each
 * event to the appropriate update handler. Uses service-role Supabase client
 * (not the cookie-based user client) because this endpoint is called by Stripe,
 * not by an authenticated user.
 *
 * Idempotency: every processed event_id is stored in stripe_events so that
 * replayed events are silently skipped.
 */

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Stripe client
// ---------------------------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// ---------------------------------------------------------------------------
// Service-role Supabase client (no cookie auth — server-side only)
// ---------------------------------------------------------------------------

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // 1. Read raw body for signature verification
  const body = await request.text();

  // 2. Verify Stripe signature
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return new Response(`Webhook signature error: ${message}`, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  // 3. Idempotency check — skip if already processed
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    // Already processed — return 200 so Stripe stops retrying
    return new Response("Already processed", { status: 200 });
  }

  // 4. Route by event type
  try {
    switch (event.type) {
      // -----------------------------------------------------------------------
      // Payout events — update stripe_connect_accounts
      // -----------------------------------------------------------------------
      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        const accountId = (event as Stripe.Event & { account?: string }).account ?? null;

        if (accountId) {
          await supabase
            .from("stripe_connect_accounts")
            .update({
              last_payout_amount: payout.amount,
              last_payout_status: "paid",
              last_payout_at: new Date(payout.arrival_date * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_account_id", accountId);
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        const accountId = (event as Stripe.Event & { account?: string }).account ?? null;

        if (accountId) {
          await supabase
            .from("stripe_connect_accounts")
            .update({
              last_payout_amount: payout.amount,
              last_payout_status: "failed",
              last_payout_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_account_id", accountId);
        }
        break;
      }

      // -----------------------------------------------------------------------
      // Account updated — sync onboarding / capability flags
      // -----------------------------------------------------------------------
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        await supabase
          .from("stripe_connect_accounts")
          .update({
            charges_enabled: account.charges_enabled ?? false,
            payouts_enabled: account.payouts_enabled ?? false,
            details_submitted: account.details_submitted ?? false,
            onboarding_complete:
              (account.charges_enabled ?? false) &&
              (account.details_submitted ?? false),
            kyc_status: account.individual?.verification?.status ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", account.id);
        break;
      }

      // -----------------------------------------------------------------------
      // Payment intent succeeded — mark invoice as paid
      // -----------------------------------------------------------------------
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await supabase
          .from("provider_invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      default:
        // Unhandled event type — still record for idempotency
        break;
    }
  } catch (err) {
    // Log but do not return 5xx — we still record the event to avoid retry
    // storms. The error should be monitored via Sentry.
    console.error("[stripe-webhook] Handler error", event.type, err);
  }

  // 5. Insert idempotency record
  const accountId = (event as Stripe.Event & { account?: string }).account ?? null;
  await supabase.from("stripe_events").insert({
    event_id: event.id,
    event_type: event.type,
    account_id: accountId,
    processed_at: new Date().toISOString(),
  });

  return new Response("OK", { status: 200 });
}
