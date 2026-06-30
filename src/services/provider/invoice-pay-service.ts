/**
 * invoice-pay-service.ts
 *
 * Server-side support for the account-free customer invoice payment page
 * (`/pay/[token]`). A signed pay-token authorises read + pay access to a single
 * invoice without a login. All access uses the service-role client (the customer
 * is unauthenticated) but is scoped to the one invoice the token resolves to.
 */

import "server-only";

import { appBaseUrl } from "@/config/brand";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  signInvoicePayToken,
  verifyInvoicePayToken,
} from "@/lib/marketplace/invoice-pay-token";
import {
  createInvoicePaymentIntentForCustomer,
  type OnsitePaymentIntent,
} from "@/services/provider/provider-onsite-payment-service";
import { invoiceTotalPence } from "@/services/provider/provider-invoice-service";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

/** Read-only invoice projection safe to show an unauthenticated payer. */
export type PublicInvoiceView = Readonly<{
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  amountPence: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  dueDate: string | null;
  notes: string | null;
  providerName: string;
}>;

function payTokenSecret(): string {
  const secret = process.env.QUOTE_SIGNING_SECRET;
  if (!secret) {
    throw new Error("QUOTE_SIGNING_SECRET is not configured");
  }
  return secret;
}

/** Build the public payment link for an invoice. */
export function buildInvoicePayUrl(invoiceId: string): string {
  return `${appBaseUrl()}/pay/${signInvoicePayToken(invoiceId, payTokenSecret())}`;
}

/** Resolve a token to its invoice id, or null if missing/invalid. */
export function resolveInvoiceIdFromToken(
  token: string | null | undefined,
): string | null {
  return verifyInvoicePayToken(token, payTokenSecret());
}

/**
 * Load the public-safe invoice view for a pay-token. Returns null when the token
 * is invalid or the invoice does not exist. Cancelled/draft invoices are not
 * exposed; paid and sent invoices are (paid so the payer sees a receipt state).
 */
export async function getInvoiceForPayment(
  token: string,
): Promise<PublicInvoiceView | null> {
  const invoiceId = resolveInvoiceIdFromToken(token);
  if (!invoiceId) return null;

  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from("provider_invoices")
    .select(
      "id, provider_id, invoice_number, status, line_items, total_amount, currency, due_date, notes",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !invoice) return null;

  const row = invoice as {
    id: string;
    provider_id: string;
    invoice_number: string;
    status: string;
    line_items: InvoiceLineItem[] | null;
    currency: string | null;
    due_date: string | null;
    notes: string | null;
  };

  if (row.status === "draft" || row.status === "cancelled") return null;

  const { data: provider } = await supabase
    .from("service_provider_details")
    .select("business_name, trading_name")
    .eq("user_id", row.provider_id)
    .maybeSingle();

  const providerRow = provider as
    | { business_name: string | null; trading_name: string | null }
    | null;

  const lineItems = row.line_items ?? [];

  return {
    invoiceId: row.id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    amountPence: invoiceTotalPence(lineItems),
    currency: (row.currency ?? "GBP").toUpperCase(),
    lineItems,
    dueDate: row.due_date,
    notes: row.notes,
    providerName:
      providerRow?.trading_name || providerRow?.business_name || "Your trader",
  };
}

/**
 * Create (or reuse) the PaymentIntent for a pay-token. The token must resolve to
 * a `sent` invoice. Throws on invalid token / non-payable invoice.
 */
export async function createPaymentIntentForToken(
  token: string,
): Promise<OnsitePaymentIntent> {
  const invoiceId = resolveInvoiceIdFromToken(token);
  if (!invoiceId) {
    throw new Error("Invalid or expired payment link");
  }
  return createInvoicePaymentIntentForCustomer(invoiceId, createAdminClient());
}
