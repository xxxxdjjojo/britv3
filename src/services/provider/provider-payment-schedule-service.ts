/**
 * provider-payment-schedule-service.ts
 *
 * Staged payment schedule management for provider bookings and quotes.
 * Supports creating multi-milestone schedules, invoicing individual milestones,
 * and marking them as paid. All monetary values are in pence (integer).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateInvoice } from "@/services/provider/provider-invoice-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MilestoneInput = Readonly<{
  label: string;
  amountPence: number;
  dueAt?: string;
}>;

export type PaymentMilestone = Readonly<{
  id: string;
  bookingId: string | null;
  quoteId: string | null;
  providerId: string;
  milestoneLabel: string;
  amountPence: number;
  dueAt: string | null;
  status: "pending" | "invoiced" | "paid" | "cancelled";
  invoiceId: string | null;
  sortOrder: number;
  createdAt: string;
}>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapRow(row: Record<string, unknown>): PaymentMilestone {
  return {
    id: row["id"] as string,
    bookingId: (row["booking_id"] as string | null) ?? null,
    quoteId: (row["quote_id"] as string | null) ?? null,
    providerId: row["provider_id"] as string,
    milestoneLabel: row["milestone_label"] as string,
    amountPence: row["amount_pence"] as number,
    dueAt: (row["due_at"] as string | null) ?? null,
    status: row["status"] as PaymentMilestone["status"],
    invoiceId: (row["invoice_id"] as string | null) ?? null,
    sortOrder: row["sort_order"] as number,
    createdAt: row["created_at"] as string,
  };
}

// ---------------------------------------------------------------------------
// createPaymentSchedule
// ---------------------------------------------------------------------------

/**
 * Creates a payment schedule of milestones for a booking/quote.
 * Validates that the milestone amounts sum to totalPence (±1 pence tolerance).
 * Inserts all milestones atomically and returns the created rows.
 */
export async function createPaymentSchedule(
  providerId: string,
  bookingId: string | null,
  quoteId: string | null,
  milestones: MilestoneInput[],
  totalPence: number,
  supabase: SupabaseClient,
): Promise<PaymentMilestone[]> {
  if (milestones.length === 0) {
    throw new Error("milestones array must not be empty");
  }

  const sum = milestones.reduce((acc, m) => acc + m.amountPence, 0);
  if (Math.abs(sum - totalPence) > 1) {
    throw new Error(
      `Milestone sum (${sum}p) does not match total (${totalPence}p). Difference: ${Math.abs(sum - totalPence)}p`,
    );
  }

  const now = new Date().toISOString();

  const rows = milestones.map((m, index) => ({
    booking_id: bookingId ?? null,
    quote_id: quoteId ?? null,
    provider_id: providerId,
    milestone_label: m.label,
    amount_pence: m.amountPence,
    due_at: m.dueAt ?? null,
    status: "pending" as const,
    invoice_id: null,
    sort_order: index,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("payment_schedules")
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to create payment schedule: ${error.message}`);

  return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
}

// ---------------------------------------------------------------------------
// getPaymentSchedule
// ---------------------------------------------------------------------------

/**
 * Returns all milestones for a booking, scoped to the provider, ordered by sort_order ASC.
 */
export async function getPaymentSchedule(
  bookingId: string,
  providerId: string,
  supabase: SupabaseClient,
): Promise<PaymentMilestone[]> {
  const { data, error } = await supabase
    .from("payment_schedules")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("provider_id", providerId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch payment schedule: ${error.message}`);

  return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
}

// ---------------------------------------------------------------------------
// invoiceMilestone
// ---------------------------------------------------------------------------

/**
 * Generates an invoice for a single milestone and marks it as 'invoiced'.
 * Throws if the milestone does not belong to the provider or is not 'pending'.
 */
export async function invoiceMilestone(
  scheduleId: string,
  providerId: string,
  clientId: string,
  supabase: SupabaseClient,
): Promise<PaymentMilestone> {
  // 1. Fetch and validate milestone
  const { data: row, error: fetchError } = await supabase
    .from("payment_schedules")
    .select("*")
    .eq("id", scheduleId)
    .eq("provider_id", providerId)
    .single();

  if (fetchError) throw new Error(`Failed to fetch milestone: ${fetchError.message}`);
  if (!row) throw new Error("Milestone not found");

  const milestone = row as Record<string, unknown>;

  if (milestone["status"] !== "pending") {
    throw new Error(
      `Milestone cannot be invoiced: current status is '${milestone["status"]}'. Only pending milestones can be invoiced.`,
    );
  }

  // 2. Generate invoice with milestone amount as single line item
  const invoice = await generateInvoice(supabase, providerId, {
    booking_id: (milestone["booking_id"] as string | null) ?? undefined,
    client_id: clientId,
    line_items: [
      {
        name: milestone["milestone_label"] as string,
        quantity: 1,
        unit_price_pence: milestone["amount_pence"] as number,
        total_pence: milestone["amount_pence"] as number,
      },
    ],
  });

  // 3. Update milestone to invoiced
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("payment_schedules")
    .update({
      status: "invoiced",
      invoice_id: invoice.id,
      updated_at: now,
    })
    .eq("id", scheduleId)
    .eq("provider_id", providerId)
    .select()
    .single();

  if (updateError) throw new Error(`Failed to update milestone: ${updateError.message}`);

  return mapRow(updated as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// markMilestonePaid
// ---------------------------------------------------------------------------

/**
 * Marks a milestone as 'paid'. Throws if the milestone is not 'invoiced'.
 */
export async function markMilestonePaid(
  scheduleId: string,
  providerId: string,
  supabase: SupabaseClient,
): Promise<PaymentMilestone> {
  // 1. Fetch and validate milestone
  const { data: row, error: fetchError } = await supabase
    .from("payment_schedules")
    .select("*")
    .eq("id", scheduleId)
    .eq("provider_id", providerId)
    .single();

  if (fetchError) throw new Error(`Failed to fetch milestone: ${fetchError.message}`);
  if (!row) throw new Error("Milestone not found");

  const milestone = row as Record<string, unknown>;

  if (milestone["status"] !== "invoiced") {
    throw new Error(
      `Milestone cannot be marked paid: current status is '${milestone["status"]}'. Only invoiced milestones can be marked as paid.`,
    );
  }

  // 2. Update status to paid
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("payment_schedules")
    .update({
      status: "paid",
      updated_at: now,
    })
    .eq("id", scheduleId)
    .eq("provider_id", providerId)
    .select()
    .single();

  if (updateError) throw new Error(`Failed to update milestone: ${updateError.message}`);

  return mapRow(updated as Record<string, unknown>);
}
