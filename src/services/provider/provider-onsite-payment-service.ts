/**
 * provider-onsite-payment-service.ts
 *
 * On-site payment collection via Stripe PaymentIntent for the provider dashboard.
 * Allows providers to collect card payments from clients in person or via a payment link.
 *
 * All monetary values are in pence.
 *
 * Platform commission is 0% (TrueDeed monetises traders via subscription only).
 * The fee is computed through the single configurable lever in
 * `@/lib/payments/platform-fee`; when it is 0 no application fee is taken and
 * the full amount settles to the trader's connected account (direct charge).
 *
 * The payable amount is recomputed from the invoice line items via
 * `invoiceTotalPence`, NOT read from `provider_invoices.total_amount` (whose
 * unit is inconsistent across the codebase).
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

import { getStripe } from "@/lib/stripe";
import { platformFeePence } from "@/lib/payments/platform-fee";
import {
  invoiceTotalPence,
  markInvoicePaid,
} from "@/services/provider/provider-invoice-service";

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
  line_items: InvoiceLineItem[] | null;
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
    .select("id, provider_id, status, line_items, total_amount, stripe_payment_intent_id, booking_id")
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
// buildInvoicePaymentIntent (shared core)
// ---------------------------------------------------------------------------

/**
 * Create (or retrieve) the PaymentIntent for a `sent` invoice and persist its id.
 *
 * Charge model: a platform **destination charge** — the PaymentIntent is created
 * on the platform with `transfer_data.destination` + `on_behalf_of` set to the
 * trader's connected account, so the full amount settles to the trader. No
 * `application_fee_amount` is taken at the default 0% commission rate. Because
 * the PI lives on the platform account, the existing platform
 * `payment_intent.succeeded` webhook marks the invoice paid, and the client can
 * confirm with the platform publishable key (no per-account Stripe.js).
 *
 * Caller is responsible for authorising access to the invoice (provider
 * ownership or a verified customer pay-token) and for the `sent` status check.
 */
async function buildInvoicePaymentIntent(
  invoice: InvoiceRow,
  supabase: SupabaseClient,
): Promise<OnsitePaymentIntent> {
  const connectAccount = await fetchStripeConnect(invoice.provider_id, supabase);
  if (!connectAccount.charges_enabled) {
    throw new Error(
      "Stripe Connect charges not enabled for this provider. Complete Stripe onboarding first.",
    );
  }

  const stripeAccountId = connectAccount.stripe_account_id;
  // Recompute the payable amount from line items (unambiguous pence) rather than
  // trusting the stored total_amount column.
  const amountPence = invoiceTotalPence(invoice.line_items ?? []);
  if (!Number.isFinite(amountPence) || amountPence <= 0) {
    throw new Error("Invoice has no payable amount");
  }
  const applicationFeeAmount = platformFeePence(amountPence);

  // Idempotency: reuse an existing, still-payable PaymentIntent. A canceled PI
  // can't be paid, so fall through and create a fresh one.
  if (invoice.stripe_payment_intent_id) {
    const existing = await getStripe().paymentIntents.retrieve(
      invoice.stripe_payment_intent_id,
    );

    if (existing.status !== "canceled") {
      return {
        clientSecret: existing.client_secret ?? "",
        paymentIntentId: existing.id,
        amountPence,
        invoiceId: invoice.id,
      };
    }
  }

  const paymentIntent = await getStripe().paymentIntents.create(
    {
      amount: amountPence,
      currency: "gbp",
      transfer_data: { destination: stripeAccountId },
      on_behalf_of: stripeAccountId,
      ...(applicationFeeAmount > 0
        ? { application_fee_amount: applicationFeeAmount }
        : {}),
      metadata: {
        invoice_id: invoice.id,
        provider_id: invoice.provider_id,
        booking_id: invoice.booking_id ?? "",
      },
    },
    // Guard against a duplicate PI if the DB write below fails and the call is retried.
    { idempotencyKey: `invoice-pi-${invoice.id}` },
  );

  await supabase
    .from("provider_invoices")
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id)
    .eq("provider_id", invoice.provider_id);

  return {
    clientSecret: paymentIntent.client_secret ?? "",
    paymentIntentId: paymentIntent.id,
    amountPence,
    invoiceId: invoice.id,
  };
}

// ---------------------------------------------------------------------------
// createOnsitePaymentIntent (provider-authed)
// ---------------------------------------------------------------------------

/**
 * Provider-initiated on-site collection. The invoice must be owned by the
 * provider and have status "sent".
 */
export async function createOnsitePaymentIntent(
  providerId: string,
  invoiceId: string,
  supabase: SupabaseClient,
): Promise<OnsitePaymentIntent> {
  const invoice = await fetchInvoice(invoiceId, supabase);

  if (invoice.provider_id !== providerId) {
    throw new Error(`Invoice not owned by this provider`);
  }

  if (invoice.status !== "sent") {
    throw new Error(
      `Invoice status must be "sent" to collect payment (current status: "${invoice.status}")`,
    );
  }

  return buildInvoicePaymentIntent(invoice, supabase);
}

// ---------------------------------------------------------------------------
// createInvoicePaymentIntentForCustomer (pay-by-token)
// ---------------------------------------------------------------------------

/**
 * Customer-initiated payment via a secure pay-token. The caller MUST have
 * already verified the token maps to this invoiceId. The invoice must be "sent".
 * Pass a service-role client (the customer is unauthenticated).
 */
export async function createInvoicePaymentIntentForCustomer(
  invoiceId: string,
  supabase: SupabaseClient,
): Promise<OnsitePaymentIntent> {
  const invoice = await fetchInvoice(invoiceId, supabase);

  if (invoice.status === "paid") {
    throw new Error("This invoice has already been paid.");
  }
  if (invoice.status !== "sent") {
    throw new Error(
      `This invoice is not ready for payment (status: "${invoice.status}").`,
    );
  }

  return buildInvoicePaymentIntent(invoice, supabase);
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
  // PI lives on the platform account (destination charge), so no stripeAccount scope.
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  // The platform-owned PI is no longer implicitly scoped to the provider's
  // connected account, so verify ownership explicitly from the PI metadata.
  if (paymentIntent.metadata?.provider_id !== providerId) {
    throw new Error("PaymentIntent does not belong to this provider");
  }

  const invoiceId = paymentIntent.metadata?.invoice_id ?? "";
  let paidAt: string | null = null;

  if (paymentIntent.status === "succeeded" && invoiceId) {
    paidAt = new Date().toISOString();
    await markInvoicePaid(supabase, providerId, invoiceId, paidAt);
  }

  return {
    status: paymentIntent.status,
    invoiceId,
    paidAt,
  };
}
