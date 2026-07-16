import "server-only";

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/observability/capture-exception";
import { posthogServer } from "@/lib/analytics/posthog-server";

type ClaimedReferralCredit = Readonly<{
  credit_id: string;
  referral_id?: string;
  member_id?: string;
  credit_months?: number;
  status?: "applying" | "applied" | "busy" | "voided";
  idempotency_key?: string;
  stripe_balance_transaction_id?: string | null;
  stripe_customer_id?: string | null;
  amount_pence?: number | null;
  currency?: string | null;
}>;

type CreditBillingSnapshot = Readonly<{
  stripe_customer_id: string;
  amount_pence: number;
  currency: string;
}>;

export type ReferralCreditApplicationResult =
  | Readonly<{ status: "applied"; transactionId: string }>
  | Readonly<{ status: "already_applied"; transactionId: string | null }>
  | Readonly<{ status: "voided"; transactionId: null }>;

async function persistFailure(
  supabase: SupabaseClient,
  creditId: string,
  applicationToken: string,
  error: unknown,
): Promise<void> {
  const { error: persistenceError } = await supabase.rpc(
    "mark_referral_credit_failed",
    {
      p_credit_id: creditId,
      p_application_token: applicationToken,
      p_error_details: { message: getErrorMessage(error) },
    },
  );
  if (persistenceError) {
    throw new Error(
      `${getErrorMessage(error)}; failed to persist referral credit failure: ${persistenceError.message}`,
    );
  }
}

export async function applyReferralCredit(
  supabase: SupabaseClient,
  stripe: Stripe,
  creditId: string,
): Promise<ReferralCreditApplicationResult> {
  const applicationToken = crypto.randomUUID();
  const { data, error: claimError } = await supabase.rpc(
    "claim_referral_credit",
    {
      p_credit_id: creditId,
      p_application_token: applicationToken,
    },
  );
  if (claimError || !data) {
    throw new Error(
      `Failed to claim referral credit: ${claimError?.message ?? "no credit returned"}`,
    );
  }

  const credit = data as ClaimedReferralCredit;
  if (credit.status === "applied") {
    return {
      status: "already_applied",
      transactionId: credit.stripe_balance_transaction_id ?? null,
    };
  }
  if (credit.status === "voided") {
    return { status: "voided", transactionId: null };
  }
  if (credit.status === "busy") {
    throw new Error("Referral credit is already being applied");
  }

  try {
    if (
      !credit.member_id ||
      !credit.referral_id ||
      !credit.idempotency_key ||
      !credit.credit_months
    ) {
      throw new Error("Claimed referral credit is incomplete");
    }

    let billing: CreditBillingSnapshot | null = credit.stripe_customer_id &&
      credit.amount_pence && credit.currency
      ? {
          stripe_customer_id: credit.stripe_customer_id,
          amount_pence: credit.amount_pence,
          currency: credit.currency,
        }
      : null;

    if (!billing) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select(
          "stripe_customer_id, price_amount, currency, billing_interval, billing_interval_count",
        )
        .eq("user_id", credit.member_id)
        .maybeSingle();
      if (subscriptionError) {
        throw new Error(
          `Failed to load referrer subscription: ${subscriptionError.message}`,
        );
      }

      const plan = subscription as {
        stripe_customer_id: string | null;
        price_amount: number | null;
        currency: string | null;
        billing_interval: string | null;
        billing_interval_count: number | null;
      } | null;
      if (!plan?.stripe_customer_id || !plan.price_amount) {
        throw new Error("Referrer has no billable Stripe subscription");
      }

      const intervalCount = plan.billing_interval_count ?? 0;
      const monthsPerPeriod = plan.billing_interval === "year"
        ? intervalCount * 12
        : plan.billing_interval === "month"
          ? intervalCount
          : 0;
      if (monthsPerPeriod <= 0) {
        throw new Error("Referrer subscription has no monthly billing equivalent");
      }

      const { data: snapshot, error: snapshotError } = await supabase.rpc(
        "snapshot_referral_credit_billing",
        {
          p_credit_id: creditId,
          p_application_token: applicationToken,
          p_stripe_customer_id: plan.stripe_customer_id,
          p_amount_pence: Math.round(
            (plan.price_amount * credit.credit_months) / monthsPerPeriod,
          ),
          p_currency: plan.currency ?? "gbp",
        },
      );
      if (snapshotError || !snapshot) {
        throw new Error(
          `Failed to snapshot referral credit billing: ${snapshotError?.message ?? "no snapshot returned"}`,
        );
      }
      billing = snapshot as CreditBillingSnapshot;
    }

    const transaction = await stripe.customers.createBalanceTransaction(
      billing.stripe_customer_id,
      {
        amount: -billing.amount_pence,
        currency: billing.currency,
        description: `Referral credit (${credit.referral_id})`,
      },
      { idempotencyKey: credit.idempotency_key },
    );

    const { error: appliedError } = await supabase.rpc(
      "mark_referral_credit_applied",
      {
        p_credit_id: creditId,
        p_application_token: applicationToken,
        p_stripe_balance_transaction_id: transaction.id,
      },
    );
    if (appliedError) {
      throw new Error(
        `Failed to persist applied referral credit: ${appliedError.message}`,
      );
    }

    try {
      posthogServer?.capture?.({
        event: "credit_applied",
        distinctId: credit.member_id,
        properties: {
          creditId,
          referralId: credit.referral_id,
          creditMonths: credit.credit_months,
          amountPence: billing.amount_pence,
          currency: billing.currency,
          stripeBalanceTransactionId: transaction.id,
        },
      });
    } catch {
      // Telemetry must not change durable credit state or trigger a retry.
    }

    return { status: "applied", transactionId: transaction.id };
  } catch (error) {
    await persistFailure(supabase, creditId, applicationToken, error);
    throw error;
  }
}
