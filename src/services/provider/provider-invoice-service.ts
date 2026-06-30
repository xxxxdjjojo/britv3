/**
 * provider-invoice-service.ts
 *
 * Invoice creation, management, and payment tracking for the provider dashboard.
 * All monetary values are in pence (integer). VAT is applied at 20% by default.
 * All functions accept a SupabaseClient so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceLineItem, InvoiceStatus, ProviderInvoice } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type CreateInvoiceInput = Readonly<{
  booking_id?: string;
  client_id: string;
  line_items: InvoiceLineItem[];
  due_date_days?: number;
  notes?: string;
}>;

export type UpdateInvoiceInput = Partial<
  Pick<CreateInvoiceInput, "line_items" | "notes" | "due_date_days">
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default VAT rate (20%). */
const DEFAULT_VAT_RATE = 0.2;

/**
 * Compute invoice totals from line items.
 * VAT rate defaults to 20%. A null/undefined vat_rate is treated as 0%.
 * Returns { subtotal, vat_amount, total_amount } all in pence.
 *
 * Exported so payment paths can recompute the payable amount server-side from
 * the unambiguous `total_pence` line-item fields rather than trusting the
 * stored `total_amount` column (see invoiceTotalPence).
 */
export function computeTotals(lineItems: InvoiceLineItem[]): {
  subtotal: number;
  vat_amount: number;
  total_amount: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total_pence, 0);

  // Per-line VAT: null vat_rate treated as 0%
  const vatAmount = lineItems.reduce((sum, item) => {
    const rate = item.vat_rate ?? 0;
    return sum + Math.round(item.total_pence * rate);
  }, 0);

  // If no line items carry an explicit vat_rate, fall back to default 20% on subtotal
  const hasExplicitVat = lineItems.some((item) => item.vat_rate != null);
  const finalVat = hasExplicitVat
    ? vatAmount
    : Math.round(subtotal * DEFAULT_VAT_RATE);

  return {
    subtotal,
    vat_amount: finalVat,
    total_amount: subtotal + finalVat,
  };
}

/**
 * The payable amount of an invoice, in pence, recomputed from its line items.
 *
 * Payment code MUST use this rather than reading `provider_invoices.total_amount`
 * directly: that column's unit is inconsistent across the codebase (written in
 * pence by generateInvoice, read as pounds by some display services). Line-item
 * `total_pence` is unambiguous, so recomputing here is the safe source of truth
 * and satisfies the "never trust stored totals — recompute server-side" rule.
 */
export function invoiceTotalPence(lineItems: InvoiceLineItem[]): number {
  return computeTotals(lineItems).total_amount;
}

/** Generate a due_date ISO string from today + N days. */
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Auto-generate the next invoice number for this provider.
 * Format: INV-{YYYY}-{NNNN} (4-digit zero-padded sequential number per provider).
 */
async function generateInvoiceNumber(
  supabase: SupabaseClient,
  providerId: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const { count, error } = await supabase
    .from("provider_invoices")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId);

  if (error) {
    throw new Error(`Failed to generate invoice number: ${error.message}`);
  }

  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `INV-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// generateInvoice
// ---------------------------------------------------------------------------

/**
 * Creates a new invoice in draft status for the provider.
 * Auto-generates invoice number INV-{YYYY}-{NNNN}.
 * Computes subtotal, VAT (20% default), and total.
 */
export async function generateInvoice(
  supabase: SupabaseClient,
  providerId: string,
  input: CreateInvoiceInput,
): Promise<ProviderInvoice> {
  if (!input.client_id) {
    throw new Error("client_id is required");
  }
  if (!Array.isArray(input.line_items) || input.line_items.length === 0) {
    throw new Error("line_items must be a non-empty array");
  }

  const invoiceNumber = await generateInvoiceNumber(supabase, providerId);
  const { subtotal, vat_amount, total_amount } = computeTotals(input.line_items);
  const dueDate = input.due_date_days != null ? addDays(input.due_date_days) : null;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("provider_invoices")
    .insert({
      provider_id: providerId,
      booking_id: input.booking_id ?? null,
      client_id: input.client_id,
      invoice_number: invoiceNumber,
      line_items: input.line_items,
      subtotal,
      vat_amount,
      total_amount,
      currency: "gbp",
      status: "draft",
      due_date: dueDate,
      paid_at: null,
      stripe_payment_intent_id: null,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return data as ProviderInvoice;
}

// ---------------------------------------------------------------------------
// updateInvoice
// ---------------------------------------------------------------------------

/**
 * Updates an invoice. Only permitted when status is 'draft'.
 * Recomputes subtotal, VAT, and total when line_items are provided.
 * Returns the updated invoice.
 */
export async function updateInvoice(
  supabase: SupabaseClient,
  providerId: string,
  invoiceId: string,
  updates: UpdateInvoiceInput,
): Promise<ProviderInvoice> {
  // Fetch current invoice to verify ownership and status
  const { data: existing, error: fetchError } = await supabase
    .from("provider_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch invoice: ${fetchError.message}`);
  if (!existing) throw new Error("Invoice not found");

  const invoice = existing as ProviderInvoice;

  if (invoice.status !== "draft") {
    throw new Error(
      `Invoice cannot be updated: current status is '${invoice.status}'. Only draft invoices can be updated.`,
    );
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.line_items !== undefined) {
    const { subtotal, vat_amount, total_amount } = computeTotals(updates.line_items);
    patch["line_items"] = updates.line_items;
    patch["subtotal"] = subtotal;
    patch["vat_amount"] = vat_amount;
    patch["total_amount"] = total_amount;
  }

  if (updates.notes !== undefined) {
    patch["notes"] = updates.notes;
  }

  if (updates.due_date_days !== undefined) {
    patch["due_date"] = addDays(updates.due_date_days);
  }

  const { data, error } = await supabase
    .from("provider_invoices")
    .update(patch)
    .eq("id", invoiceId)
    .eq("provider_id", providerId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update invoice: ${error.message}`);
  return data as ProviderInvoice;
}

// ---------------------------------------------------------------------------
// sendInvoice
// ---------------------------------------------------------------------------

/**
 * Transition an invoice to 'sent' so it can be paid by the customer.
 * Idempotent for an already-sent invoice (allows re-sending). Rejects paid or
 * cancelled invoices. Returns the updated invoice.
 */
export async function sendInvoice(
  supabase: SupabaseClient,
  providerId: string,
  invoiceId: string,
): Promise<ProviderInvoice> {
  const { data: existing, error: fetchError } = await supabase
    .from("provider_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch invoice: ${fetchError.message}`);
  if (!existing) throw new Error("Invoice not found");

  const invoice = existing as ProviderInvoice;
  if (invoice.status === "paid") throw new Error("Invoice is already paid");
  if (invoice.status === "cancelled") throw new Error("Cannot send a cancelled invoice");

  const { data, error } = await supabase
    .from("provider_invoices")
    .update({ status: "sent" as InvoiceStatus, updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("provider_id", providerId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to send invoice: ${error.message}`);
  return data as ProviderInvoice;
}

// ---------------------------------------------------------------------------
// markInvoicePaid
// ---------------------------------------------------------------------------

/**
 * Marks an invoice as paid. Sets status='paid' and paid_at to the provided
 * timestamp (defaults to now). Throws if the invoice is already paid or
 * does not belong to the provider.
 */
export async function markInvoicePaid(
  supabase: SupabaseClient,
  providerId: string,
  invoiceId: string,
  paidAt?: string,
): Promise<ProviderInvoice> {
  const resolvedPaidAt = paidAt ?? new Date().toISOString();

  const { data, error } = await supabase
    .from("provider_invoices")
    .update({
      status: "paid" as InvoiceStatus,
      paid_at: resolvedPaidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("provider_id", providerId)
    .neq("status", "paid") // guard: don't double-mark as paid
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Failed to mark invoice as paid: ${error.message}`);
  if (!data) {
    throw new Error(
      "Invoice not found, does not belong to this provider, or is already marked as paid.",
    );
  }

  return data as ProviderInvoice;
}

// ---------------------------------------------------------------------------
// getInvoicesByProvider
// ---------------------------------------------------------------------------

/**
 * Returns all invoices for the provider, optionally filtered by status.
 * Ordered by created_at DESC.
 */
export async function getInvoicesByProvider(
  supabase: SupabaseClient,
  providerId: string,
  status?: InvoiceStatus,
): Promise<ProviderInvoice[]> {
  let query = supabase
    .from("provider_invoices")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (status !== undefined) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
  return (data ?? []) as ProviderInvoice[];
}
