/**
 * trust-score-service.ts
 *
 * Shared trust score computation and persistence for provider verification.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type VerificationStepForScore = {
  stepId: string;
  status: string;
};

const WEIGHTS: Record<string, number> = {
  id_check: 25,
  insurance: 25,
  qualifications: 20,
  client_references: 15,
  peer_references: 15,
};

/** Derive a 0-100 trust score from the 5 verification steps. */
export function computeTrustScore(steps: readonly VerificationStepForScore[]): number {
  let earned = 0;
  for (const step of steps) {
    if (step.status === "approved") {
      earned += WEIGHTS[step.stepId] ?? 10;
    } else if (step.status === "submitted") {
      earned += Math.floor((WEIGHTS[step.stepId] ?? 10) * 0.5);
    }
  }
  return Math.min(100, earned);
}

/** Persist the computed trust score to service_provider_details. */
export async function persistTrustScore(
  providerId: string,
  score: number,
  supabase: SupabaseClient,
): Promise<void> {
  await supabase
    .from("service_provider_details")
    .update({ trust_score: score })
    .eq("id", providerId);
}
