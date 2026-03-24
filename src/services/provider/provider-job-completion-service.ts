/**
 * provider-job-completion-service.ts
 *
 * Orchestrates the job completion flow for a provider booking.
 *
 * The service uses an intermediate "completing" state so that if a crash
 * occurs between setting "completing" and "completed", the booking is left
 * in a detectable limbo state rather than being incorrectly marked completed
 * without an invoice.
 *
 * Flow:
 *   in_progress → completing → [optional invoice] → completed
 *                                    ↓ (on failure)
 *                               in_progress (rollback)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceLineItem } from "@/types/provider-dashboard";
import { canTransition } from "@/lib/marketplace/booking-state-machine";
import { generateInvoice } from "@/services/provider/provider-invoice-service";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CompletionInput = Readonly<{
  generateInvoice?: boolean;
  notes?: string;
  lineItems?: InvoiceLineItem[];
  clientId?: string;
}>;

export type CompletionResult = Readonly<{
  bookingId: string;
  status: "completed" | "rolled_back";
  invoiceId?: string;
  error?: string;
}>;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Initiates job completion for a booking owned by the given provider.
 *
 * Steps:
 * 1. Fetch & validate the booking (exists, owned by provider, status is in_progress)
 * 2. Validate the state-machine transition in_progress → completing
 * 3. Set intermediate status to "completing" + insert history entry
 * 4. Optionally generate an invoice (wrapped in try/catch for rollback)
 * 5. Set final status to "completed" + set actual_end_date + insert history entry
 * 6. Return { status: "completed", bookingId, invoiceId? }
 *
 * On any failure after step 3, rolls back booking to "in_progress" and
 * returns { status: "rolled_back", error }.
 */
export async function initiateJobCompletion(
  bookingId: string,
  providerId: string,
  supabase: SupabaseClient,
  options?: CompletionInput,
): Promise<CompletionResult> {
  // -------------------------------------------------------------------------
  // Step 1: Fetch booking
  // -------------------------------------------------------------------------
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, provider_id, status, user_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError || !booking) {
    return {
      bookingId,
      status: "rolled_back",
      error: "Booking not found",
    };
  }

  const row = booking as Record<string, unknown>;

  // Ownership check
  if ((row["provider_id"] as string) !== providerId) {
    return {
      bookingId,
      status: "rolled_back",
      error: "Forbidden: booking does not belong to this provider",
    };
  }

  // Status check
  if ((row["status"] as string) !== "in_progress") {
    return {
      bookingId,
      status: "rolled_back",
      error: `Booking must be in_progress to complete (current status: ${row["status"]})`,
    };
  }

  // -------------------------------------------------------------------------
  // Step 2: Validate state-machine transition
  // -------------------------------------------------------------------------
  const { allowed } = canTransition("in_progress", "completing", "provider");
  if (!allowed) {
    return {
      bookingId,
      status: "rolled_back",
      error: "State machine: transition in_progress → completing is not allowed",
    };
  }

  // -------------------------------------------------------------------------
  // Step 3: Set intermediate "completing" state
  // -------------------------------------------------------------------------
  await supabase
    .from("bookings")
    .update({ status: "completing", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  await supabase.from("booking_status_history").insert({
    booking_id: bookingId,
    from_status: "in_progress",
    to_status: "completing",
    changed_by: providerId,
    reason: "Job completion initiated",
    created_at: new Date().toISOString(),
  });

  // -------------------------------------------------------------------------
  // Steps 4–7: Optional invoice + complete or rollback
  // -------------------------------------------------------------------------
  let invoiceId: string | undefined;

  if (options?.generateInvoice === true) {
    const clientId = options.clientId ?? (row["user_id"] as string);
    const lineItems = options.lineItems ?? [];

    try {
      const invoice = await generateInvoice(supabase, providerId, {
        booking_id: bookingId,
        client_id: clientId,
        line_items: lineItems,
        notes: options.notes,
      });
      invoiceId = invoice.id;
    } catch (err) {
      // Rollback: restore in_progress
      await supabase
        .from("bookings")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      await supabase.from("booking_status_history").insert({
        booking_id: bookingId,
        from_status: "completing",
        to_status: "in_progress",
        changed_by: providerId,
        reason: "Rollback: invoice generation failed",
        created_at: new Date().toISOString(),
      });

      const message = err instanceof Error ? err.message : String(err);
      return {
        bookingId,
        status: "rolled_back",
        error: message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Step 8: Finalise as "completed"
  // -------------------------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("bookings")
    .update({
      status: "completed",
      actual_end_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  await supabase.from("booking_status_history").insert({
    booking_id: bookingId,
    from_status: "completing",
    to_status: "completed",
    changed_by: providerId,
    reason: "Job completed",
    created_at: new Date().toISOString(),
  });

  return {
    bookingId,
    status: "completed",
    invoiceId,
  };
}
