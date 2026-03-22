/**
 * provider-cash-position-service.ts
 *
 * Aggregates invoice data (sent, paid, overdue) and Stripe balance to give
 * the provider a real-time view of their cash position.
 * All monetary values are in pence (GBP × 100).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripeBalance } from "@/services/provider/provider-payment-service";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type CashPosition = Readonly<{
  /** Sum of sent (awaiting payment) invoices in pence */
  invoicedPence: number;
  /** Number of sent invoices */
  invoicedCount: number;
  /** Sum of paid invoices in pence */
  receivedPence: number;
  /** Number of paid invoices */
  receivedCount: number;
  /** Sum of overdue invoices in pence */
  overduePence: number;
  /** Number of overdue invoices */
  overdueCount: number;
  /** Stripe Connect available balance in pence */
  stripeAvailablePence: number;
  /** Stripe Connect pending balance in pence */
  stripePendingPence: number;
  /** receivedPence + stripeAvailablePence - overduePence */
  netPositionPence: number;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type InvoiceRow = { total_amount: number };

/**
 * Sums total_amount rows and converts pounds → pence.
 * DB stores total_amount as NUMERIC(10,2) in pounds.
 */
function sumInvoiceRows(rows: InvoiceRow[]): number {
  return rows.reduce(
    (acc, row) => acc + Math.round((row.total_amount ?? 0) * 100),
    0,
  );
}

// ---------------------------------------------------------------------------
// getCashPosition
// ---------------------------------------------------------------------------

/**
 * Returns a CashPosition snapshot for the given provider.
 * Uses Promise.allSettled so individual failures don't break the whole response.
 * Any failed sub-query defaults to 0; Stripe errors are also swallowed.
 */
export async function getCashPosition(
  providerId: string,
  supabase: SupabaseClient,
): Promise<CashPosition> {
  // 3 parallel DB queries
  const [sentResult, paidResult, overdueResult] = await Promise.allSettled([
    supabase
      .from("provider_invoices")
      .select("total_amount")
      .eq("provider_id", providerId)
      .eq("status", "sent"),

    supabase
      .from("provider_invoices")
      .select("total_amount")
      .eq("provider_id", providerId)
      .eq("status", "paid"),

    supabase
      .from("provider_invoices")
      .select("total_amount")
      .eq("provider_id", providerId)
      .eq("status", "overdue"),
  ]);

  // Extract rows (default to empty on failure)
  const sentRows: InvoiceRow[] =
    sentResult.status === "fulfilled" && !sentResult.value.error
      ? (sentResult.value.data ?? [])
      : [];

  const paidRows: InvoiceRow[] =
    paidResult.status === "fulfilled" && !paidResult.value.error
      ? (paidResult.value.data ?? [])
      : [];

  const overdueRows: InvoiceRow[] =
    overdueResult.status === "fulfilled" && !overdueResult.value.error
      ? (overdueResult.value.data ?? [])
      : [];

  // Aggregate invoice totals
  const invoicedPence = sumInvoiceRows(sentRows);
  const invoicedCount = sentRows.length;
  const receivedPence = sumInvoiceRows(paidRows);
  const receivedCount = paidRows.length;
  const overduePence = sumInvoiceRows(overdueRows);
  const overdueCount = overdueRows.length;

  // Stripe balance — non-critical, defaults to 0 on any error
  let stripeAvailablePence = 0;
  let stripePendingPence = 0;
  try {
    const balance = await getStripeBalance(providerId, supabase);
    stripeAvailablePence = balance.availablePence;
    stripePendingPence = balance.pendingPence;
  } catch {
    // Leave at 0 — provider may not have a Stripe Connect account yet
  }

  const netPositionPence = receivedPence + stripeAvailablePence - overduePence;

  return {
    invoicedPence,
    invoicedCount,
    receivedPence,
    receivedCount,
    overduePence,
    overdueCount,
    stripeAvailablePence,
    stripePendingPence,
    netPositionPence,
  };
}
