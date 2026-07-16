/**
 * Pure dispatcher for Stripe webhook event types.
 *
 * Same code as the previous inline switch in
 * `src/app/api/webhooks/stripe/route.ts` — extracted so the DLQ function can
 * re-run it with a stored payload. Throws on any failure so the caller can
 * mark_billing_event_failed and emit to DLQ.
 */

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { resolveInternalPlanId } from "@/lib/billing-config";
import { captureException } from "@/lib/observability/capture-exception";
import { appBaseUrl } from "@/config/brand";
import { inngest } from "@/inngest/client";
import {
  cancelPlacementBySubscription,
  fulfilPlacementCheckout,
  isPlacementCheckout,
  renewPlacementBySubscription,
} from "@/services/placements/placement-fulfillment";

export type StripeEventProcessResult = Readonly<{
  userId: string | null;
}>;

/**
 * Look up user profile (email + first_name) by stripe_customer_id.
 * Returns null if not found.
 */
async function lookupUserByCustomerId(
  supabase: SupabaseClient,
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

type ProviderReferral = Readonly<{
  id: string;
  referrer_id: string;
  provider_state: "gate_complete" | "converted" | "credited";
}>;

async function requestProviderReferralCredit(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice,
  customerId: string,
): Promise<void> {
  if (invoice.status !== "paid" || (invoice.amount_paid ?? 0) <= 0) return;
  if (
    invoice.parent?.type !== "subscription_details" ||
    !invoice.parent.subscription_details?.subscription
  ) {
    return;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("user_id, role")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (subscriptionError) {
    throw new Error(
      `Failed to identify paid provider subscription: ${subscriptionError.message}`,
    );
  }

  const providerSubscription = subscription as {
    user_id: string;
    role: string | null;
  } | null;
  if (
    !providerSubscription ||
    !["provider", "service_provider"].includes(providerSubscription.role ?? "")
  ) {
    return;
  }

  const { data: referral, error: referralError } = await supabase
    .from("referrals")
    .select("id, referrer_id, provider_state")
    .eq("referred_id", providerSubscription.user_id)
    .in("provider_state", ["gate_complete", "converted", "credited"])
    .maybeSingle();
  if (referralError) {
    throw new Error(`Failed to find provider referral: ${referralError.message}`);
  }
  if (!referral) return;

  const providerReferral = referral as ProviderReferral;
  if (providerReferral.provider_state === "gate_complete") {
    const { error: transitionError } = await supabase.rpc(
      "advance_provider_referral",
      {
        p_referral_id: providerReferral.id,
        p_referred_profile_id: providerSubscription.user_id,
        p_target_state: "converted",
      },
    );
    if (transitionError) {
      throw new Error(
        `Failed to convert provider referral: ${transitionError.message}`,
      );
    }
  }

  const { data: creditId, error: creditError } = await supabase.rpc(
    "issue_referral_credit",
    {
      p_referral_id: providerReferral.id,
      p_member_id: providerReferral.referrer_id,
      p_credit_months: 1,
    },
  );
  if (creditError || !creditId) {
    throw new Error(
      `Failed to issue referral credit: ${creditError?.message ?? "no credit returned"}`,
    );
  }

  await inngest.send({
    name: "billing/referral.credit-requested",
    data: { creditId: creditId as string },
  });
}

/**
 * Dispatch a Stripe event to the correct handler branch.
 *
 * Mirrors the previous inline switch verbatim; any DB write failure throws so
 * the caller can mark the billing event failed and emit a DLQ event.
 */
export async function processStripeEvent(
  supabase: SupabaseClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<StripeEventProcessResult> {
  let userId: string | null = null;

  switch (event.type) {
    // ─── Platform billing events ─────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      userId = session.metadata?.user_id ?? session.client_reference_id ?? null;

      // Featured Trader boost: separate, recurring advertising subscription.
      if (isPlacementCheckout(session)) {
        await fulfilPlacementCheckout(supabase, stripe, session);
        userId = session.metadata?.provider_id ?? userId;
        break;
      }

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
          throw new Error(`Failed to upsert subscription: ${error.message}`);
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

        revalidateTag("billing", "max");

        // Force JWT token refresh so custom claims update immediately
        // Without this, user sees stale plan in JWT for up to 1 hour
        try {
          await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { force_refresh: Date.now() },
          });
        } catch (refreshErr) {
          // Non-critical: claims will update on next natural token refresh
          captureException(refreshErr, {
            module: "billing",
            feature: "stripe-event",
            operation: "forceTokenRefresh",
            extra: { userId, eventType: event.type },
          });
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
          throw new Error(`Failed to update subscription: ${error.message}`);
        }
      }

      revalidateTag("billing", "max");

      // Force JWT token refresh so custom claims update immediately
      // Without this, user sees stale plan in JWT for up to 1 hour
      if (userId) {
        try {
          await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { force_refresh: Date.now() },
          });
        } catch (refreshErr) {
          // Non-critical: claims will update on next natural token refresh
          captureException(refreshErr, {
            module: "billing",
            feature: "stripe-event",
            operation: "forceTokenRefresh",
            extra: { userId, eventType: event.type },
          });
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
        throw new Error(`Failed to cancel subscription: ${error.message}`);
      }

      // Cancel any boost placement tied to this subscription (no-op if none).
      await cancelPlacementBySubscription(supabase, subscription.id);

      revalidateTag("billing", "max");

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
        captureException(refreshErr, {
          module: "billing",
          feature: "stripe-event",
          operation: "forceTokenRefreshOnCancel",
          extra: { customerId, eventType: event.type },
        });
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
              retryUrl: `${appBaseUrl()}/dashboard/billing`,
            });
          } catch (emailErr) {
            captureException(emailErr, {
              module: "billing",
              feature: "stripe-event",
              operation: "sendPaymentFailedEmail",
              extra: { userId: user.userId, eventType: event.type },
            });
          }
        }
      }

      revalidateTag("billing", "max");
      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : (invoice.customer as Stripe.Customer)?.id ?? null;

      // Renew any boost placement billed by this invoice (no-op if none).
      const invoiceSubId = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
      const placementSubId = typeof invoiceSubId === "string" ? invoiceSubId : invoiceSubId?.id ?? null;
      if (placementSubId) {
        const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null;
        await renewPlacementBySubscription(supabase, placementSubId, periodEnd);
      }

      if (customerId) {
        await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
          .eq("status", "past_due");

        await requestProviderReferralCredit(supabase, invoice, customerId);

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
            captureException(emailErr, {
              module: "billing",
              feature: "stripe-event",
              operation: "sendPaymentConfirmationEmail",
              extra: { userId: user.userId, eventType: event.type },
            });
          }
        }
      }

      revalidateTag("billing", "max");
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
          throw new Error(`Failed to update refund_request: ${error.message}`);
        }

        userId = (refundRequest as { user_id: string | null }).user_id;
      }

      revalidateTag("billing", "max");
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
      console.warn(`[stripe-event-processor] Unhandled event type: ${event.type}`);
  }

  return { userId };
}
