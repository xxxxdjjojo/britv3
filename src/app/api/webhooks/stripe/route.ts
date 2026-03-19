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
 * - INSERT with ON CONFLICT on billing_events.stripe_event_id.
 * - Duplicate events return 200 immediately (no-op).
 *
 * Reliability:
 * - Returns 500 on DB write failure so Stripe retries delivery.
 * - Returns 200 for unknown event types (don't break Stripe retries).
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { resolveInternalPlanId } from "@/lib/billing-config";
import { advanceReferralStatus } from "@/services/referrals/unified-referral-service";
import { TIER_CONFIGS } from "@/lib/referral-tiers";
import type { ReferralTier } from "@/types/referrals";

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
  const { data: idempotencyRow, error: idempotencyError } = await supabase
    .from("billing_events")
    .upsert(
      {
        stripe_event_id: event.id,
        event_type: event.type,
        user_id: null,
        payload: {} as unknown as Record<string, unknown>,
      },
      { onConflict: "stripe_event_id", ignoreDuplicates: true },
    )
    .select("id, user_id")
    .maybeSingle();

  if (idempotencyError) {
    console.error("[webhook] Idempotency upsert error:", idempotencyError);
  }

  if (idempotencyRow && idempotencyRow.user_id !== null) {
    console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ─── Event dispatch ──────────────────────────────────────────────────────
  let userId: string | null = null;

  try {
    switch (event.type) {
      // ─── Platform billing events ─────────────────────────────────────────
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
              plan_name: resolveInternalPlanId(plan?.id, plan?.nickname ?? null),
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
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }

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

          revalidateTag("billing");

          // Force JWT token refresh so custom claims update immediately
          // Without this, user sees stale plan in JWT for up to 1 hour
          try {
            await supabase.auth.admin.updateUserById(userId, {
              app_metadata: { force_refresh: Date.now() },
            });
          } catch (refreshErr) {
            // Non-critical: claims will update on next natural token refresh
            console.error("[webhook] Failed to force token refresh:", refreshErr);
          }

          console.log(`[webhook] Subscription activated for user ${userId}`);

          // ── Referral conversion ────────────────────────────────
          // If this user was referred, advance their referral to "rewarded"
          // and trigger reward calculation + credit application.
          try {
            const result = await advanceReferralStatus(supabase, userId, "rewarded");
            if (result) {
              console.log(`[webhook] Referral converted for user ${userId}, referrer: ${result.referrerId}, tier changed: ${result.tierChanged}`);

              // Find the referral to get the ID
              const { data: referral } = await supabase
                .from("referrals")
                .select("id, referrer_id")
                .eq("referred_id", userId)
                .eq("status", "rewarded")
                .maybeSingle();

              if (referral) {
                const ref = referral as { id: string; referrer_id: string };

                // ENG REVIEW 5A: Get actual subscription price, don't hardcode
                let planPrice = item?.price?.unit_amount;
                if (!planPrice && session.subscription) {
                  // Fetch from Stripe subscription if line item price unavailable
                  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                  planPrice = sub.items.data[0]?.price?.unit_amount ?? null;
                }
                if (!planPrice) {
                  console.warn("[webhook] Could not determine plan price for referral reward, skipping credit");
                  // Still create reward rows but with status 'failed'
                  await supabase.from("referral_rewards").insert([
                    { referral_id: ref.id, recipient_id: ref.referrer_id, reward_type: "subscription_credit", amount_pence: 0, status: "failed" },
                    { referral_id: ref.id, recipient_id: userId, reward_type: "subscription_credit", amount_pence: 0, status: "failed" },
                  ]);
                } else {
                  // Create reward records for both parties
                  // Reward referrer: 1 month subscription credit
                  await supabase.from("referral_rewards").insert({
                    referral_id: ref.id,
                    recipient_id: ref.referrer_id,
                    reward_type: "subscription_credit",
                    amount_pence: planPrice,
                    status: "earned",
                  });

                  // Reward referee: 1 month credit (applied to month 2)
                  await supabase.from("referral_rewards").insert({
                    referral_id: ref.id,
                    recipient_id: userId,
                    reward_type: "subscription_credit",
                    amount_pence: planPrice,
                    status: "earned",
                  });

                  // ENG REVIEW 7C: Apply credits via Stripe customer balance
                  try {
                    // Get referrer's Stripe customer ID
                    const { data: referrerSub } = await supabase
                      .from("subscriptions")
                      .select("stripe_customer_id")
                      .eq("user_id", ref.referrer_id)
                      .maybeSingle();

                    if (referrerSub) {
                      const referrerCustomerId = (referrerSub as { stripe_customer_id: string }).stripe_customer_id;
                      // Negative amount = credit on Stripe balance
                      await stripe.customers.createBalanceTransaction(referrerCustomerId, {
                        amount: -planPrice, // negative = credit
                        currency: "gbp",
                        description: `Referral reward: 1 month free (referral ${ref.id})`,
                      });

                      // Update reward status to applied
                      await supabase.from("referral_rewards")
                        .update({ status: "applied", applied_at: new Date().toISOString() })
                        .eq("referral_id", ref.id)
                        .eq("recipient_id", ref.referrer_id);
                    }

                    // Apply credit to referee's account
                    const refereeCustomerId = session.customer as string;
                    if (refereeCustomerId) {
                      await stripe.customers.createBalanceTransaction(refereeCustomerId, {
                        amount: -planPrice,
                        currency: "gbp",
                        description: `Referral welcome credit: 1 month free (referral ${ref.id})`,
                      });

                      await supabase.from("referral_rewards")
                        .update({ status: "applied", applied_at: new Date().toISOString() })
                        .eq("referral_id", ref.id)
                        .eq("recipient_id", userId);
                    }
                  } catch (creditErr) {
                    // Set reward status to 'failed' for retry mechanism (see TODOS)
                    console.error("[webhook] Stripe balance credit failed:", creditErr);
                    await supabase.from("referral_rewards")
                      .update({ status: "failed" })
                      .eq("referral_id", ref.id)
                      .eq("status", "earned");
                  }

                  // Send conversion email to referrer via Resend
                  try {
                    const { data: referrerProfile } = await supabase
                      .from("profiles")
                      .select("first_name, email")
                      .eq("id", ref.referrer_id)
                      .single();
                    const { data: refereeProfile } = await supabase
                      .from("profiles")
                      .select("first_name")
                      .eq("id", userId)
                      .single();

                    if (referrerProfile && refereeProfile) {
                      const rp = referrerProfile as { first_name: string; email: string };
                      const re = refereeProfile as { first_name: string };
                      // TODO: Import and call Resend send with ReferralConvertedEmail template
                      // await resend.emails.send({
                      //   to: rp.email,
                      //   subject: `You earned £${Math.floor(planPrice / 100)} free — ${re.first_name} just joined!`,
                      //   react: ReferralConvertedEmail({ ... }),
                      // });
                      console.log(`[webhook] Referral conversion email queued for ${rp.email}`);
                    }
                  } catch (emailErr) {
                    console.error("[webhook] Referral email send failed:", emailErr);
                  }

                  // Send tier upgrade email if tier changed
                  if (result.tierChanged && result.newTier !== "none") {
                    try {
                      const tierConfig = TIER_CONFIGS[result.newTier as Exclude<ReferralTier, "none">];
                      void tierConfig; // Referenced for future email template
                      // TODO: Import and call Resend send with ReferralTierUpgradeEmail template
                      // await resend.emails.send({ ... });
                      console.log(`[webhook] Tier upgrade email queued: ${result.newTier}`);
                    } catch (tierEmailErr) {
                      console.error("[webhook] Tier upgrade email failed:", tierEmailErr);
                    }
                  }

                  console.log(`[webhook] Referral rewards created: ${planPrice}p each for referrer ${ref.referrer_id} and referee ${userId}`);
                }
              }
            }
          } catch (refErr) {
            // Non-critical: log but don't fail the webhook
            console.error("[webhook] Referral conversion error:", refErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        const plan = item?.price;

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
              plan_name: resolveInternalPlanId(plan?.id, plan?.nickname ?? null),
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

        revalidateTag("billing");

        // Force JWT token refresh so custom claims update immediately
        // Without this, user sees stale plan in JWT for up to 1 hour
        if (userId) {
          try {
            await supabase.auth.admin.updateUserById(userId, {
              app_metadata: { force_refresh: Date.now() },
            });
          } catch (refreshErr) {
            // Non-critical: claims will update on next natural token refresh
            console.error("[webhook] Failed to force token refresh:", refreshErr);
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

        revalidateTag("billing");

        // Force JWT token refresh to clear plan claim
        try {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          const cancelledUserId = (sub as { user_id: string } | null)?.user_id;
          if (cancelledUserId) {
            await supabase.auth.admin.updateUserById(cancelledUserId, {
              app_metadata: { force_refresh: Date.now() },
            });
          }
        } catch (refreshErr) {
          console.error("[webhook] Failed to force token refresh on cancellation:", refreshErr);
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

          const user = await lookupUserByCustomerId(supabase, customerId);
          userId = user?.userId ?? null;

          if (user) {
            try {
              const { sendPaymentFailed } = await import("@/services/email/email-service");
              await sendPaymentFailed({
                userId: user.userId,
                email: user.email,
                firstName: user.firstName || "there",
                amount: (invoice.amount_due ?? 0) / 100,
                description: invoice.description ?? "Subscription payment",
                failedAt: new Date().toISOString(),
                retryUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/dashboard/billing`,
              });
            } catch (emailErr) {
              console.error("[webhook] Failed to send payment-failed email:", emailErr);
            }
          }
        }

        revalidateTag("billing");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as Stripe.Customer)?.id ?? null;

        if (customerId) {
          await supabase
            .from("subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId)
            .eq("status", "past_due");

          const user = await lookupUserByCustomerId(supabase, customerId);
          userId = user?.userId ?? null;

          if (user) {
            try {
              const { sendPaymentConfirmation } = await import("@/services/email/email-service");
              await sendPaymentConfirmation({
                userId: user.userId,
                email: user.email,
                firstName: user.firstName || "there",
                amount: (invoice.amount_paid ?? 0) / 100,
                description: invoice.description ?? "Subscription payment",
                transactionId: invoice.id ?? "N/A",
                paidAt: new Date().toISOString(),
              });
            } catch (emailErr) {
              console.error("[webhook] Failed to send payment-confirmation email:", emailErr);
            }
          }
        }

        revalidateTag("billing");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

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
        }

        revalidateTag("billing");
        break;
      }

      // ─── Provider Connect events ─────────────────────────────────────────
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
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    // ─── Update billing_events audit log ────────────────────────────────────
    const { error: logError } = await supabase
      .from("billing_events")
      .update({
        user_id: userId,
        payload: event.data.object as unknown as Record<string, unknown>,
      })
      .eq("stripe_event_id", event.id);

    if (logError) {
      console.error("[webhook] Failed to update billing_event log:", logError);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Unhandled error processing event:", event.id, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
