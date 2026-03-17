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
 * - INSERT with ON CONFLICT on billing_events.stripe_event_id.
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
import { revalidateTag } from "next/cache";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

// This route needs the raw body for signature verification.
// We read it via request.text() before any JSON parsing.
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

/**
 * Look up user profile (email + first_name) by stripe_customer_id.
 * Returns null if not found.
 */
async function lookupUserByCustomerId(
  supabase: ReturnType<typeof getServiceSupabase>,
  customerId: string,
): Promise<{ userId: string; email: string; firstName: string } | null> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  const userId = (sub as { user_id: string } | null)?.user_id ?? null;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name")
    .eq("id", userId)
    .maybeSingle();

  const email = (profile as { email?: string } | null)?.email ?? null;
  const firstName = (profile as { first_name?: string } | null)?.first_name ?? "";

  if (!email) return null;
  return { userId, email, firstName };
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

  // ─── Idempotency check (atomic INSERT with ON CONFLICT) ─────────────────
  // Attempt to upsert into billing_events keyed on stripe_event_id.
  // If the row already has a non-null user_id, it was already processed.
  // ignoreDuplicates ensures we don't overwrite an existing processed row.
  const { data: idempotencyRow, error: idempotencyError } = await supabase
    .from("billing_events")
    .upsert(
      {
        stripe_event_id: event.id,
        event_type: event.type,
        user_id: null, // populated after event dispatch
        payload: {} as unknown as Record<string, unknown>,
      },
      { onConflict: "stripe_event_id", ignoreDuplicates: true },
    )
    .select("id, user_id")
    .maybeSingle();

  if (idempotencyError) {
    console.error("[webhook] Idempotency upsert error:", idempotencyError);
  }

  // If the row already existed with a user_id set, this event was already processed
  if (idempotencyRow && idempotencyRow.user_id !== null) {
    console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ─── Event dispatch ──────────────────────────────────────────────────────
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

          revalidateTag("billing", "max");
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

        revalidateTag("billing", "max");
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

        revalidateTag("billing", "max");
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

        // Find user for billing event log + email
        if (customerId) {
          const user = await lookupUserByCustomerId(supabase, customerId);
          userId = user?.userId ?? null;

          // Best-effort email notification
          if (user) {
            try {
              const { sendPaymentFailed } = await import("@/services/email/email-service");
              const amountDue = invoice.amount_due ?? 0;
              await sendPaymentFailed({
                userId: user.userId,
                email: user.email,
                firstName: user.firstName || "there",
                amount: amountDue / 100,
                description: invoice.description ?? "Subscription payment",
                failedAt: new Date().toISOString(),
                retryUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/dashboard/billing`,
              });
            } catch (emailErr) {
              console.error("[webhook] Failed to send payment-failed email:", emailErr);
            }
          }
        }

        revalidateTag("billing", "max");
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

          // Find user for email
          const user = await lookupUserByCustomerId(supabase, customerId);
          userId = user?.userId ?? null;

          // Best-effort email notification
          if (user) {
            try {
              const { sendPaymentConfirmation } = await import("@/services/email/email-service");
              const amountPaid = invoice.amount_paid ?? 0;
              await sendPaymentConfirmation({
                userId: user.userId,
                email: user.email,
                firstName: user.firstName || "there",
                amount: amountPaid / 100,
                description: invoice.description ?? "Subscription payment",
                transactionId: invoice.id ?? "N/A",
                paidAt: new Date().toISOString(),
              });
            } catch (emailErr) {
              console.error("[webhook] Failed to send payment-confirmation email:", emailErr);
            }
          }
        }

        revalidateTag("billing", "max");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Find the refund_request by stripe_charge_id
        const { data: refundRequest } = await supabase
          .from("refund_requests")
          .select("id, user_id")
          .eq("stripe_charge_id", charge.id)
          .maybeSingle();

        if (refundRequest) {
          const stripeRefundId = charge.refunds?.data?.[0]?.id ?? null;

          const { error } = await supabase
            .from("refund_requests")
            .update({
              status: "processed",
              processed_at: new Date().toISOString(),
              stripe_refund_id: stripeRefundId,
            })
            .eq("id", refundRequest.id);

          if (error) {
            console.error("[webhook] Failed to update refund_request:", error);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }

          userId = (refundRequest as { user_id: string | null }).user_id;

          // Best-effort refund confirmation email
          if (userId) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("email, first_name")
                .eq("id", userId)
                .maybeSingle();

              const email = (profile as { email?: string } | null)?.email;
              const firstName = (profile as { first_name?: string } | null)?.first_name ?? "";

              if (email) {
                const { sendRefundConfirmation } = await import("@/services/email/email-service");
                const refundAmountPence = charge.amount_refunded ?? 0;
                await sendRefundConfirmation({
                  userId,
                  email,
                  userName: firstName || "there",
                  refundAmount: `\u00A3${(refundAmountPence / 100).toFixed(2)}`,
                  chargeReference: charge.id,
                  refundDate: new Date().toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                });
              }
            } catch (emailErr) {
              console.error("[webhook] Failed to send refund-confirmation email:", emailErr);
            }
          }

          console.log(`[webhook] Refund processed for charge ${charge.id}`);
        } else {
          console.log(`[webhook] charge.refunded for ${charge.id} — no matching refund_request`);
        }

        revalidateTag("billing", "max");
        break;
      }

      default:
        // Unknown event type — return 200 so Stripe doesn't retry
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    // ─── Update billing_events audit log with user_id and payload ──────────
    const { error: logError } = await supabase
      .from("billing_events")
      .update({
        user_id: userId,
        payload: event.data.object as unknown as Record<string, unknown>,
      })
      .eq("stripe_event_id", event.id);

    if (logError) {
      console.error("[webhook] Failed to update billing_event log:", logError);
      // Non-fatal — we already processed the event; don't 500 for log failure
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Unhandled error processing event:", event.id, err);
    // Return 500 → Stripe will retry
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
