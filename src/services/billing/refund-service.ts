/**
 * Refund service — full state machine for refund request lifecycle.
 *
 * Flow:
 *   1. User calls createRequest() → inserts with status "submitted"
 *   2. If amount ≤ REFUND_AUTO_APPROVE_LIMIT_PENCE → auto-approves via Stripe
 *   3. Otherwise → "pending_review" for admin
 *   4. Admin calls processRefund() to approve/reject
 *
 * All writes use service-role client to bypass RLS.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// Constants
// ============================================================================

/** Refunds at or below this amount (in pence) are auto-approved. £100 */
export const REFUND_AUTO_APPROVE_LIMIT_PENCE = 10_000;

/** Refunds can only be requested within this many days of the charge. */
export const REFUND_WINDOW_DAYS = 14;

// ============================================================================
// Types
// ============================================================================

export type RefundStatus =
  | "submitted"
  | "auto_approved"
  | "pending_review"
  | "approved"
  | "rejected"
  | "processed";

export type RefundRequest = Readonly<{
  id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount_pence: number;
  reason: string;
  details: string | null;
  status: RefundStatus;
  admin_id: string | null;
  admin_notes: string | null;
  stripe_refund_id: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}>;

export type RefundListFilters = Readonly<{
  status?: RefundStatus;
  page?: number;
  limit?: number;
}>;

// ============================================================================
// Create refund request
// ============================================================================

/**
 * Creates a new refund request. Auto-approves if amount ≤ £100 (10,000 pence).
 * Returns the created refund request record.
 */
export async function createRequest(
  _supabase: SupabaseClient,
  userId: string,
  stripeChargeId: string,
  amountPence: number,
  reason: string,
  details?: string,
): Promise<RefundRequest> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const autoApprove = amountPence <= REFUND_AUTO_APPROVE_LIMIT_PENCE;
  const initialStatus: RefundStatus = autoApprove ? "auto_approved" : "pending_review";

  // Insert the request
  const { data: request, error: insertError } = await admin
    .from("refund_requests")
    .insert({
      user_id: userId,
      stripe_charge_id: stripeChargeId,
      amount_pence: amountPence,
      reason,
      details: details ?? null,
      status: initialStatus,
    })
    .select("*")
    .single();

  if (insertError || !request) {
    throw new Error(`Failed to create refund request: ${insertError?.message ?? "unknown error"}`);
  }

  // Auto-approve: process via Stripe immediately
  if (autoApprove) {
    try {
      const refund = await stripe.refunds.create({
        charge: stripeChargeId,
        amount: amountPence,
        reason: "requested_by_customer",
      });

      const { error: updateError } = await admin
        .from("refund_requests")
        .update({
          stripe_refund_id: refund.id,
          status: "processed" as RefundStatus,
          processed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) {
        console.error("Failed to update refund request after Stripe refund:", updateError);
      }

      return {
        ...request,
        stripe_refund_id: refund.id,
        status: "processed",
        processed_at: new Date().toISOString(),
      } as RefundRequest;
    } catch (stripeError) {
      // Stripe refund failed — mark as pending_review for manual handling
      await admin
        .from("refund_requests")
        .update({
          status: "pending_review" as RefundStatus,
          admin_notes: `Auto-approve Stripe call failed: ${stripeError instanceof Error ? stripeError.message : "unknown"}`,
        })
        .eq("id", request.id);

      return {
        ...request,
        status: "pending_review",
      } as RefundRequest;
    }
  }

  return request as RefundRequest;
}

// ============================================================================
// Admin: process refund request
// ============================================================================

/**
 * Admin processes a refund request — approve or reject.
 * On approve: calls stripe.refunds.create(), updates stripe_refund_id.
 * On reject: sets status to "rejected".
 */
export async function processRefund(
  _supabase: SupabaseClient,
  requestId: string,
  adminId: string,
  action: "approve" | "reject",
  notes?: string,
): Promise<RefundRequest> {
  const admin = createAdminClient();

  // Fetch the existing request
  const { data: request, error: fetchError } = await admin
    .from("refund_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    throw new Error(`Refund request not found: ${fetchError?.message ?? "unknown"}`);
  }

  if (action === "reject") {
    const { data: updated, error: updateError } = await admin
      .from("refund_requests")
      .update({
        status: "rejected" as RefundStatus,
        admin_id: adminId,
        admin_notes: notes ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(`Failed to reject refund: ${updateError?.message ?? "unknown"}`);
    }

    // TODO: send rejection email via Resend

    return updated as RefundRequest;
  }

  // action === "approve"
  const stripe = getStripe();

  const refund = await stripe.refunds.create({
    charge: request.stripe_charge_id as string,
    amount: request.amount_pence as number,
    reason: "requested_by_customer",
  });

  const { data: updated, error: updateError } = await admin
    .from("refund_requests")
    .update({
      status: "approved" as RefundStatus,
      admin_id: adminId,
      admin_notes: notes ?? null,
      stripe_refund_id: refund.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(`Failed to update approved refund: ${updateError?.message ?? "unknown"}`);
  }

  return updated as RefundRequest;
}

// ============================================================================
// Read operations
// ============================================================================

/**
 * Returns a single refund request by ID.
 */
export async function getRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<RefundRequest | null> {
  const { data, error } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch refund request: ${error.message}`);
  return (data as RefundRequest | null) ?? null;
}

/**
 * Lists refund requests with optional filters. For admin use.
 */
export async function listRequests(
  supabase: SupabaseClient,
  filters: RefundListFilters = {},
): Promise<{ data: RefundRequest[]; count: number }> {
  const { status, page = 1, limit = 20 } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("refund_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list refund requests: ${error.message}`);

  return {
    data: (data ?? []) as RefundRequest[],
    count: count ?? 0,
  };
}
