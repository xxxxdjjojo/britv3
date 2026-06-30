/**
 * provider-payment-service.ts
 *
 * Stripe Connect payment operations for the provider dashboard.
 * All monetary values are in pence (GBP × 100).
 *
 * Functions:
 *  - getStripeConnectAccount(supabase, providerId)
 *  - initiateStripeConnect(supabase, providerId, userEmail)
 *  - getOnboardingLink(stripeAccountId, origin)
 *  - getStripeBalance(providerId, supabase)
 *  - getPayoutHistory(providerId, limit, supabase)
 *  - getTransactionDetail(transactionId, providerId, supabase)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { getCommissionRate } from "@/lib/commission-rates";
import { platformFeePence } from "@/lib/payments/platform-fee";
import type { StripeConnectAccount } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Stripe client — server-only
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is required");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type StripeBalance = Readonly<{
  /** Funds that can be paid out immediately, in pence */
  availablePence: number;
  /** Funds in transit (not yet settled), in pence */
  pendingPence: number;
  /** ISO 4217 currency code, always "gbp" for UK providers */
  currency: string;
  /** Next scheduled payout date (ISO 8601), or null */
  nextPayoutDate: string | null;
  /** Next scheduled payout amount in pence, or null */
  nextPayoutAmountPence: number | null;
}>;

export type PayoutRecord = Readonly<{
  /** Stripe payout id */
  id: string;
  /** Amount paid out in pence */
  amountPence: number;
  /** ISO 4217 currency code */
  currency: string;
  /** 'paid' | 'pending' | 'in_transit' | 'failed' | 'cancelled' */
  status: string;
  /** ISO 8601 date when payout was initiated */
  initiatedAt: string;
  /** ISO 8601 date when payout arrived in bank, or null */
  arrivedAt: string | null;
  /** Bank account last 4 digits (masked), or null */
  bankLast4: string | null;
}>;

export type TransactionDetail = Readonly<{
  /** Transaction id */
  id: string;
  /** 'job_payment' | 'platform_fee' | 'refund' | 'payout' | 'adjustment' */
  type: string;
  /** Gross amount in pence (before platform fee) */
  grossAmountPence: number;
  /** Platform fee deducted, in pence. 0 — TrueDeed takes no commission on jobs. */
  platformFeePence: number;
  /** Net amount credited to provider in pence */
  netAmountPence: number;
  /** ISO 4217 currency code */
  currency: string;
  /** 'pending' | 'completed' | 'failed' | 'refunded' */
  status: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** Related job id, or null */
  jobId: string | null;
  /** Client name associated with the transaction */
  clientName: string | null;
  /** Stripe charge / payment intent id for reconciliation */
  stripePaymentIntentId: string | null;
}>;

export type OnboardingLink = Readonly<{
  url: string;
}>;

// ---------------------------------------------------------------------------
// Platform fee — memo v2 tier-banded
// ---------------------------------------------------------------------------

/**
 * Displayed platform fee for a trader's actual transactions. Routed through the
 * single commission lever (`platformFeePence`), which is 0% — TrueDeed takes no
 * commission on trader jobs. Kept separate from the dormant memo-pivot
 * `calculatePlatformFee` projection below so what a trader SEES matches what is
 * actually charged (0).
 */
function displayedPlatformFeePence(grossAmountPence: number): number {
  return platformFeePence(grossAmountPence);
}

/**
 * Compute the platform fee for a provider job/transaction.
 *
 * Memo Pivot v2 — the rate is per-plan (Listed 12%, Pro 10%, Elite 6%,
 * niche providers 6%). When the provider's plan id is unknown the
 * conservative DEFAULT_COMMISSION_RATE (12%) is applied so we never
 * under-charge.
 *
 * Returns the fee in pence. Always at most `grossAmountPence` (a
 * malformed gross value can never owe more than itself).
 */
export function calculatePlatformFee(args: {
  grossAmountPence: number;
  providerPlanId: string | null | undefined;
}): number {
  const { grossAmountPence, providerPlanId } = args;
  if (!Number.isFinite(grossAmountPence) || grossAmountPence <= 0) return 0;
  const rate = getCommissionRate(providerPlanId);
  const fee = Math.round(grossAmountPence * rate);
  return Math.min(fee, grossAmountPence);
}

// ---------------------------------------------------------------------------
// getStripeConnectAccount
// ---------------------------------------------------------------------------

/**
 * Fetch the stripe_connect_accounts row for a provider.
 * Returns null if no account has been created yet.
 */
export async function getStripeConnectAccount(
  supabase: SupabaseClient,
  providerId: string,
): Promise<StripeConnectAccount | null> {
  const { data, error } = await supabase
    .from("stripe_connect_accounts")
    .select("*")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as StripeConnectAccount;
}

// ---------------------------------------------------------------------------
// initiateStripeConnect
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Express account for the provider if one does not exist.
 * Inserts a row into stripe_connect_accounts.
 * Returns the stripe_account_id.
 */
export async function initiateStripeConnect(
  supabase: SupabaseClient,
  providerId: string,
  userEmail: string,
): Promise<string> {
  // Check for existing account
  const existing = await getStripeConnectAccount(supabase, providerId);
  if (existing) return existing.stripe_account_id;

  // Create Stripe Express account
  const account = await getStripe().accounts.create({
    type: "express",
    country: "GB",
    email: userEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      mcc: "1731", // Home improvement contractors
    },
  });

  // Persist to DB
  const { error } = await supabase.from("stripe_connect_accounts").insert({
    provider_id: providerId,
    stripe_account_id: account.id,
    onboarding_complete: false,
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to save Stripe account: ${error.message}`);
  }

  return account.id;
}

// ---------------------------------------------------------------------------
// getOnboardingLink
// ---------------------------------------------------------------------------

/**
 * Generate a Stripe Connect onboarding link for a given Express account.
 */
export async function getOnboardingLink(
  stripeAccountId: string,
  origin: string,
): Promise<OnboardingLink> {
  const link = await getStripe().accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/dashboard/provider/payments/connect/refresh`,
    return_url: `${origin}/dashboard/provider/payments/connect/return`,
    type: "account_onboarding",
  });

  return { url: link.url };
}

// ---------------------------------------------------------------------------
// Internal: resolve stripe account id from provider id
// ---------------------------------------------------------------------------

async function resolveStripeAccountId(
  providerId: string,
  supabase: SupabaseClient,
): Promise<string> {
  const account = await getStripeConnectAccount(supabase, providerId);
  if (!account) {
    throw new Error(`No Stripe Connect account found for provider ${providerId}`);
  }
  return account.stripe_account_id;
}

// ---------------------------------------------------------------------------
// getStripeBalance
// ---------------------------------------------------------------------------

/**
 * Retrieve the Stripe Connect balance for a provider.
 * Falls back to cached DB values on StripeConnectionError.
 * Throws on StripeInvalidRequestError.
 */
export async function getStripeBalance(
  providerId: string,
  supabase: SupabaseClient,
): Promise<StripeBalance> {
  const stripeAccountId = await resolveStripeAccountId(providerId, supabase);

  let balance: Stripe.Balance;
  try {
    balance = await getStripe().balance.retrieve({
      stripeAccount: stripeAccountId,
    });
  } catch (err) {
    // On connection error try DB-cached values; on invalid request rethrow
    if (err instanceof Stripe.errors.StripeConnectionError) {
      const cached = await getStripeConnectAccount(supabase, providerId);
      return {
        availablePence: cached?.last_payout_amount ?? 0,
        pendingPence: 0,
        currency: "gbp",
        nextPayoutDate: cached?.last_payout_at ?? null,
        nextPayoutAmountPence: null,
      };
    }
    throw err;
  }

  // Extract GBP amounts (Stripe returns amounts per currency)
  const available = balance.available.find((b) => b.currency === "gbp");
  const pending = balance.pending.find((b) => b.currency === "gbp");

  // Fetch next scheduled payout
  let nextPayoutDate: string | null = null;
  let nextPayoutAmountPence: number | null = null;
  try {
    const payouts = await getStripe().payouts.list(
      { limit: 1, status: "pending" },
      { stripeAccount: stripeAccountId },
    );
    if (payouts.data.length > 0) {
      const next = payouts.data[0];
      nextPayoutDate = new Date(next.arrival_date * 1000).toISOString().split("T")[0] ?? null;
      nextPayoutAmountPence = next.amount;
    }
  } catch {
    // Non-critical — leave null
  }

  return {
    availablePence: available?.amount ?? 0,
    pendingPence: pending?.amount ?? 0,
    currency: available?.currency ?? "gbp",
    nextPayoutDate,
    nextPayoutAmountPence,
  };
}

// ---------------------------------------------------------------------------
// getPayoutHistory
// ---------------------------------------------------------------------------

/**
 * Returns a list of payouts for a provider, ordered by created_at descending.
 */
export async function getPayoutHistory(
  providerId: string,
  limit = 20,
  supabase: SupabaseClient,
): Promise<PayoutRecord[]> {
  let stripeAccountId: string;
  try {
    stripeAccountId = await resolveStripeAccountId(providerId, supabase);
  } catch {
    // No Stripe account yet — return empty list
    return [];
  }

  try {
    const payouts = await getStripe().payouts.list(
      { limit, expand: ["data.destination"] },
      { stripeAccount: stripeAccountId },
    );

    return payouts.data.map((payout): PayoutRecord => {
      const dest = payout.destination;
      let bankLast4: string | null = null;
      if (dest && typeof dest === "object" && "last4" in dest) {
        bankLast4 = (dest as { last4: string }).last4;
      }

      return {
        id: payout.id,
        amountPence: payout.amount,
        currency: payout.currency,
        status: payout.status,
        initiatedAt: new Date(payout.created * 1000).toISOString(),
        arrivedAt:
          payout.arrival_date
            ? new Date(payout.arrival_date * 1000).toISOString()
            : null,
        bankLast4,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getTransactionDetail
// ---------------------------------------------------------------------------

/**
 * Returns detailed transaction information for a given transactionId (charge id
 * or provider_invoice id). Throws if the transaction belongs to a different provider.
 * Returns null if the transaction does not exist.
 */
export async function getTransactionDetail(
  transactionId: string,
  providerId: string,
  supabase: SupabaseClient,
): Promise<TransactionDetail | null> {
  // First try to look up from provider_invoices table
  const { data: invoice, error: invoiceError } = await supabase
    .from("provider_invoices")
    .select(`
      id,
      provider_id,
      status,
      total_amount,
      stripe_payment_intent_id,
      created_at,
      bookings (
        id,
        profiles:client_id (
          full_name
        )
      )
    `)
    .eq("id", transactionId)
    .maybeSingle();

  if (!invoiceError && invoice) {
    // Authorization check
    if ((invoice as { provider_id: string }).provider_id !== providerId) {
      throw new Error("Authorization error: transaction belongs to a different provider");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = invoice as any;
    const grossAmountPence = (inv.total_amount as number) ?? 0;
    const platformFeePence = displayedPlatformFeePence(grossAmountPence);
    const netAmountPence = grossAmountPence - platformFeePence;

    const booking = Array.isArray(inv.bookings) ? inv.bookings[0] : inv.bookings;
    const profile = booking
      ? Array.isArray(booking.profiles)
        ? booking.profiles[0]
        : booking.profiles
      : null;

    const statusMap: Record<string, string> = {
      paid: "completed",
      draft: "pending",
      sent: "pending",
      overdue: "pending",
      cancelled: "failed",
    };

    return {
      id: inv.id as string,
      type: "job_payment",
      grossAmountPence,
      platformFeePence,
      netAmountPence,
      currency: "gbp",
      status: statusMap[inv.status as string] ?? "pending",
      createdAt: inv.created_at as string,
      jobId: (booking?.id as string | undefined) ?? null,
      clientName: (profile?.full_name as string | undefined) ?? null,
      stripePaymentIntentId: (inv.stripe_payment_intent_id as string | undefined) ?? null,
    };
  }

  // Fall back to Stripe charge lookup
  let stripeAccountId: string | null = null;
  try {
    stripeAccountId = await resolveStripeAccountId(providerId, supabase);
  } catch {
    return null;
  }

  try {
    const charge = await getStripe().charges.retrieve(transactionId, {
      stripeAccount: stripeAccountId,
    });

    const grossAmountPence = charge.amount;
    const platformFeePence = displayedPlatformFeePence(grossAmountPence);
    const netAmountPence = grossAmountPence - platformFeePence;

    return {
      id: charge.id,
      type: "job_payment",
      grossAmountPence,
      platformFeePence,
      netAmountPence,
      currency: charge.currency,
      status: charge.status === "succeeded" ? "completed" : charge.status,
      createdAt: new Date(charge.created * 1000).toISOString(),
      jobId: null,
      clientName: charge.billing_details?.name ?? null,
      stripePaymentIntentId:
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null),
    };
  } catch (err) {
    // Handle both real Stripe SDK errors and test mock errors
    const isResourceMissing =
      (err instanceof Stripe.errors.StripeInvalidRequestError &&
        (err as Stripe.errors.StripeInvalidRequestError).code === "resource_missing") ||
      (err instanceof Error &&
        (err as Error & { code?: string }).code === "resource_missing");

    if (isResourceMissing) {
      return null;
    }
    throw err;
  }
}
