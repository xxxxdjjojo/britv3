/**
 * Shared helpers for billing_events table operations.
 *
 * Used by both the Stripe webhook route and the DLQ replay function so that
 * idempotency tracking stays consistent across the dispatch and the replay
 * paths.
 */

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/observability/capture-exception";

export type BillingEventClaim = Readonly<{
  status: string;
  should_process: boolean;
}>;

/**
 * Atomically claim a billing_events row by stripe_event_id. Returns the claim
 * status; if `should_process` is false the caller should treat this as a
 * duplicate delivery.
 */
export async function claimBillingEvent(
  supabase: SupabaseClient,
  event: Stripe.Event,
): Promise<BillingEventClaim> {
  const { data, error } = await supabase
    .rpc("claim_billing_event", {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_payload: event.data.object as unknown as Record<string, unknown>,
    })
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Failed to claim billing event: ${error?.message ?? "no row returned"}`,
    );
  }

  return data as BillingEventClaim;
}

/**
 * Mark a billing_events row as processed. Called on the happy path after the
 * dispatched handler succeeds (in both the webhook route and the DLQ replay).
 */
export async function markBillingEventProcessed(
  supabase: SupabaseClient,
  event: Stripe.Event,
  userId: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("mark_billing_event_processed", {
    p_stripe_event_id: event.id,
    p_user_id: userId,
    p_payload: event.data.object as unknown as Record<string, unknown>,
  });

  if (error) {
    throw new Error(
      `Failed to mark billing event processed: ${error.message}`,
    );
  }
}

/**
 * Mark a billing_events row as failed (records last_error + increments
 * attempt_count via the RPC). Errors here are swallowed — the caller is
 * already in a failure path.
 */
export async function markBillingEventFailed(
  supabase: SupabaseClient,
  event: Stripe.Event,
  error: unknown,
): Promise<void> {
  await supabase.rpc("mark_billing_event_failed", {
    p_stripe_event_id: event.id,
    p_error: getErrorMessage(error),
  });
}
