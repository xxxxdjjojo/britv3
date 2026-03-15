/**
 * POST /api/webhooks/stripe
 *
 * Receives and processes Stripe webhook events.
 *
 * Security:
 * - Validates Stripe-Signature header before touching payload.
 * - Uses raw body (not parsed JSON) for signature verification.
 *
 * Idempotency:
 * - Checks billing_events.stripe_event_id before processing.
 * - Duplicate events return 200 immediately (no-op).
 *
 * Reliability:
 * - Returns 500 on DB write failure so Stripe retries delivery.
 * - Returns 200 for unknown event types (don't break Stripe retries).
 *
 * This route MUST NOT use the default Next.js body parser.
 * bodyParser is disabled via the `runtime = "edge"` or by reading
 * request.text() directly.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// This route needs the raw body for signature verification.
// We read it via request.text() before any JSON parsing.
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

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

  // ─── Idempotency check ──────────────────────────────────────────────────────
  // If we've already processed this event, return 200 immediately.
  const { data: existing } = await supabase
    .from("billing_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ─── Event dispatch ──────────────────────────────────────────────────────────
  let userId: string | null = null;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        userId = session.metadata?.user_id ?? session.client_reference_id ?? null;

        if (userId && session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(subId);
          const item = subscription.items.data[0];
          const plan = item?.price;

          const { error } = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
              status: subscription.status,
              plan_name: plan?.nickname ?? plan?.metadata?.name ?? null,
              price_amount: item?.price.unit_amount ?? null,
              currency: plan?.currency ?? "gbp",
              current_period_end: item?.current_period_end
                ? new Date(item.current_period_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
              role: session.metadata?.role ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

          if (error) {
            console.error("[webhook] Failed to upsert subscription:", error);
            // Return 500 → Stripe will retry
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }

          // Also persist stripe_customer_id on profile
          if (session.customer) {
            await supabase
              .from("profiles")
              .update({
                stripe_customer_id: typeof session.customer === "string"
                  ? session.customer
                  : session.customer.id,
              })
              .eq("id", userId);
          }

          console.log(`[webhook] Subscription activated for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        const plan = item?.price;

        // Find user by stripe_customer_id
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        userId = (sub as { user_id: string } | null)?.user_id ?? null;

        if (userId) {
          const { error } = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              status: subscription.status,
              plan_name: plan?.nickname ?? plan?.metadata?.name ?? null,
              price_amount: item?.price.unit_amount ?? null,
              currency: plan?.currency ?? "gbp",
              current_period_end: item?.current_period_end
                ? new Date(item.current_period_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

          if (error) {
            console.error("[webhook] Failed to update subscription:", error);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("[webhook] Failed to cancel subscription:", error);
          return NextResponse.json({ error: "Database write failed" }, { status: 500 });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as Stripe.Customer)?.id ?? null;

        if (customerId) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId);
        }

        // Find user for billing event log
        if (customerId) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          userId = (sub as { user_id: string } | null)?.user_id ?? null;
        }

        console.log(`[webhook] Payment failed for customer ${customerId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as Stripe.Customer)?.id ?? null;

        if (customerId) {
          // Restore active status if was past_due
          await supabase
            .from("subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId)
            .eq("status", "past_due");
        }
        break;
      }

      default:
        // Unknown event type — return 200 so Stripe doesn't retry
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    // ─── Append to billing_events audit log ──────────────────────────────────
    const { error: logError } = await supabase.from("billing_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      user_id: userId,
      payload: event.data.object as unknown as Record<string, unknown>,
    });

    if (logError) {
      console.error("[webhook] Failed to write billing_event log:", logError);
      // Non-fatal — we already processed the event; don't 500 for log failure
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Unhandled error processing event:", event.id, err);
    // Return 500 → Stripe will retry
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
