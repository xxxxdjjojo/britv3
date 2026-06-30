/**
 * provider-transaction-gate.ts
 *
 * Server-side gate for trader transacting actions (sending live quotes,
 * issuing invoices, taking payment). A trader may browse the dashboard freely
 * (proxy.ts exempts those pages), but cannot transact until they are:
 *   1. email verified
 *   2. admin approved (provider_verification_status = 'verified')
 *   3. on an active/trialing subscription
 *   4. connected for payouts (Stripe charges + payouts enabled)
 *
 * Checks run in that order and return the first failure with a typed reason and
 * a human-readable message suitable for surfacing to the trader.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type TransactionGateReason =
  | "email_unverified"
  | "not_approved"
  | "subscription_inactive"
  | "payout_not_connected";

export type TransactionGateResult =
  | { allowed: true }
  | { allowed: false; reason: TransactionGateReason; message: string };

const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "trialing",
]);

const MESSAGES: Record<TransactionGateReason, string> = {
  email_unverified:
    "Verify your email address before sending quotes or invoices.",
  not_approved:
    "Your trader account is awaiting admin approval. You can send quotes and invoices once approved.",
  subscription_inactive:
    "An active subscription is required to send quotes, issue invoices, or take payment.",
  payout_not_connected:
    "Connect your Stripe payout account before sending invoices or taking payment.",
};

function blocked(reason: TransactionGateReason): TransactionGateResult {
  return { allowed: false, reason, message: MESSAGES[reason] };
}

/**
 * Determine whether the trader (identified by userId, which is also the
 * provider_id) may perform a transacting action.
 *
 * @param opts.emailConfirmed Pass the value from supabase.auth.getUser() —
 *   `user.email_confirmed_at != null`. Required (not defaulted) so a caller can
 *   never accidentally fail open on the email-verification check.
 */
export async function checkProviderCanTransact(
  supabase: SupabaseClient,
  userId: string,
  opts: { emailConfirmed: boolean },
): Promise<TransactionGateResult> {
  if (!opts.emailConfirmed) {
    return blocked("email_unverified");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("provider_verification_status")
    .eq("id", userId)
    .maybeSingle();

  const verificationStatus =
    (profile as { provider_verification_status: string | null } | null)
      ?.provider_verification_status ?? null;

  if (verificationStatus !== "verified") {
    return blocked("not_approved");
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  const subStatus = (sub as { status: string } | null)?.status ?? null;
  if (!subStatus || !ACTIVE_SUBSCRIPTION_STATUSES.has(subStatus)) {
    return blocked("subscription_inactive");
  }

  const { data: connect } = await supabase
    .from("stripe_connect_accounts")
    .select("charges_enabled, payouts_enabled")
    .eq("provider_id", userId)
    .maybeSingle();

  const connectRow =
    (connect as { charges_enabled: boolean; payouts_enabled: boolean } | null) ??
    null;
  if (!connectRow || !connectRow.charges_enabled || !connectRow.payouts_enabled) {
    return blocked("payout_not_connected");
  }

  return { allowed: true };
}
