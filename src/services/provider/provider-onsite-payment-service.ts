/**
 * provider-onsite-payment-service.ts
 *
 * On-site payment collection via Stripe PaymentIntent for the provider dashboard.
 * Allows providers to collect card payments from clients in person or via a payment link.
 *
 * All monetary values are in pence (GBP × 100).
 * Platform fee: 2.5% applied via application_fee_amount.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getStripe } from "@/lib/stripe";
import { markInvoicePaid } from "@/services/provider/provider-invoice-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_FEE_RATE = 0.025; // 2.5%

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type OnsitePaymentIntent = Readonly<{
  clientSecret: string;
  paymentIntentId: string;
  amountPence: number;
  invoiceId: string;
}>;

export type PaymentConfirmation = Readonly<{
  status: string;
  invoiceId: string;
  paidAt: string | null;
}>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type InvoiceRow = {
  id: string;
  provider_id: string;
  status: string;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  booking_id: string | null;
};

type StripeConnectRow = {
  stripe_account_id: string;
  charges_enabled: boolean;
};

async function fetchInvoice(
  invoiceId: string,
  supabase: SupabaseClient,
): Promise<InvoiceRow> {
  const { data, error } = await supabase
    .from("provider_invoices")
    .select("id, provider_id, status, total_amount, stripe_payment_intent_id, booking_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  return data as InvoiceRow;
}

async function fetchStripeConnect(
  providerId: string,
  supabase: SupabaseClient,
): Promise<StripeConnectRow> {
  const { data, error } = await supabase
    .from("stripe_connect_accounts")
    .select("stripe_account_id, charges_enabled")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`No Stripe Connect account found for provider ${providerId}`);
  }

  return data as StripeConnectRow;
}

// ---------------------------------------------------------------------------
// createOnsitePaymentIntent
// ---------------------------------------------------------------------------

/**
 * Create (or retrieve existing) Stripe PaymentIntent for collecting on-site payment.
 *
 * Steps:
 * 1. Fetch invoice — must exist, be owned by provider, and have status "sent"
 * 2. Fetch Stripe Connect account — must have charges_enabled
 * 3. Idempotency: if invoice already has a stripe_payment_intent_id, retrieve it
 * 4. Create new PaymentIntent with platform fee and destination
 * 5. Update invoice with the new paymentIntentId
 */
export async function createOnsitePaymentIntent(
  providerId: string,
  invoiceId: string,
  supabase: SupabaseClient,
): Promise<OnsitePaymentIntent> {
  // 1. Validate invoice
  const invoice = await fetchInvoice(invoiceId, supabase);

  if (invoice.provider_id !== providerId) {
    throw new Error(`Invoice not owned by this provider`);
  }

  if (invoice.status !== "sent") {
    throw new Error(
      `Invoice status must be "sent" to collect payment (current status: "${invoice.status}")`,
    );
  }

  // 2. Validate Stripe Connect account
  const connectAccount = await fetchStripeConnect(providerId, supabase);

  if (!connectAccount.charges_enabled) {
    throw new Error(
      "Stripe Connect charges not enabled for this provider. Complete Stripe onboarding first.",
    );
  }

  const stripeAccountId = connectAccount.stripe_account_id;
  const amountPence = Math.round(invoice.total_amount * 100);
  const applicationFeeAmount = Math.round(amountPence * PLATFORM_FEE_RATE);

  // 3. Idempotency: return existing PaymentIntent if already created
  if (invoice.stripe_payment_intent_id) {
    const existing = await getStripe().paymentIntents.retrieve(
      invoice.stripe_payment_intent_id,
      { stripeAccount: stripeAccountId },
    );

    return {
      clientSecret: existing.client_secret ?? "",
      paymentIntentId: existing.id,
      amountPence,
      invoiceId,
    };
  }

  // 4. Create new PaymentIntent
  const paymentIntent = await getStripe().paymentIntents.create(
    {
      amount: amountPence,
      currency: "gbp",
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: stripeAccountId },
      metadata: {
        invoice_id: invoiceId,
        provider_id: providerId,
        booking_id: invoice.booking_id ?? "",
      },
    },
    { stripeAccount: stripeAccountId },
  );

  // 5. Update invoice with paymentIntentId
  await supabase
    .from("provider_invoices")
    .update({ stripe_payment_intent_id: paymentIntent.id, updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("provider_id", providerId);

  return {
    clientSecret: paymentIntent.client_secret ?? "",
    paymentIntentId: paymentIntent.id,
    amountPence,
    invoiceId,
  };
}

// ---------------------------------------------------------------------------
// confirmOnsitePayment
// ---------------------------------------------------------------------------

/**
 * Confirm an on-site payment by retrieving the PaymentIntent from Stripe.
 * If the PaymentIntent status is "succeeded", marks the invoice as paid.
 */
export async function confirmOnsitePayment(
  providerId: string,
  paymentIntentId: string,
  supabase: SupabaseClient,
): Promise<PaymentConfirmation> {
  // Resolve the provider's Stripe account to scope the retrieve
  const connectAccount = await fetchStripeConnect(providerId, supabase);

  const paymentIntent = await getStripe().paymentIntents.retrieve(
    paymentIntentId,
    { stripeAccount: connectAccount.stripe_account_id },
  );

  const invoiceId = paymentIntent.metadata?.invoice_id ?? "";
  let paidAt: string | null = null;

  if (paymentIntent.status === "succeeded") {
    paidAt = new Date().toISOString();
    await markInvoicePaid(supabase, providerId, invoiceId, paidAt);
  }

  return {
    status: paymentIntent.status,
    invoiceId,
    paidAt,
  };
}
