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

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, price_amount, currency")
      .eq("user_id", credit.member_id)
      .maybeSingle();
    if (subscriptionError) {
      throw new Error(
        `Failed to load referrer subscription: ${subscriptionError.message}`,
      );
    }

    const billing = subscription as {
      stripe_customer_id: string | null;
      price_amount: number | null;
      currency: string | null;
    } | null;
    if (!billing?.stripe_customer_id || !billing.price_amount) {
      throw new Error("Referrer has no billable Stripe subscription");
    }

    const transaction = await stripe.customers.createBalanceTransaction(
      billing.stripe_customer_id,
      {
        amount: -(billing.price_amount * credit.credit_months),
        currency: billing.currency ?? "gbp",
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
          amountPence: billing.price_amount * credit.credit_months,
          currency: billing.currency ?? "gbp",
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
