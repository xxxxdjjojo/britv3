/**
 * provider-referral-service.ts
 *
 * Referral programme management for the provider dashboard.
 * Each provider gets a unique 8-character referral code (generated via nanoid).
 * Referral tracking and reward aggregation are read from the provider_referrals table.
 *
 * Functions:
 *  - getReferralCode(supabase, providerId)
 *  - getReferralStats(supabase, providerId)
 *  - getReferrals(supabase, providerId)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

import type { ProviderReferral, ReferralStatus } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type ReferralStats = Readonly<{
  total: number;
  by_status: Readonly<Record<ReferralStatus, number>>;
  total_rewards_pence: number;
}>;

// ---------------------------------------------------------------------------
// getReferralCode
// ---------------------------------------------------------------------------

/**
 * Returns the referral code for the given provider.
 * If no code exists yet, generates an 8-character nanoid, inserts a seed row
 * into provider_referrals, and returns the new code.
 *
 * The seed row has no referred_user_id (null) and status = 'pending'.
 * It serves purely as the canonical code record for the provider.
 */
export async function getReferralCode(
  supabase: SupabaseClient,
  providerId: string,
): Promise<string> {
  // Check for an existing code owned by this provider
  const { data: existing, error: fetchError } = await supabase
    .from("provider_referrals")
    .select("referral_code")
    .eq("referrer_id", providerId)
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (existing) {
    return (existing as { referral_code: string }).referral_code;
  }

  // Generate a new unique code
  const code = nanoid(8);

  const { error: insertError } = await supabase.from("provider_referrals").insert({
    referrer_id: providerId,
    referred_user_id: null,
    referral_code: code,
    status: "pending",
    reward_amount: null,
    rewarded_at: null,
    created_at: new Date().toISOString(),
  });

  if (insertError) throw new Error(insertError.message);

  return code;
}

// ---------------------------------------------------------------------------
// getReferralStats
// ---------------------------------------------------------------------------

/**
 * Returns aggregated referral statistics for the given provider:
 *  - total: total number of referral rows
 *  - by_status: count per ReferralStatus
 *  - total_rewards_pence: sum of reward_amount across rewarded referrals
 */
export async function getReferralStats(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ReferralStats> {
  const { data, error } = await supabase
    .from("provider_referrals")
    .select("status, reward_amount")
    .eq("referrer_id", providerId);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { status: ReferralStatus; reward_amount: number | null }[];

  const by_status: Record<ReferralStatus, number> = {
    pending: 0,
    signed_up: 0,
    verified: 0,
    rewarded: 0,
  };

  let total_rewards_pence = 0;

  for (const row of rows) {
    by_status[row.status] = (by_status[row.status] ?? 0) + 1;
    if (row.status === "rewarded" && row.reward_amount != null) {
      total_rewards_pence += row.reward_amount;
    }
  }

  return {
    total: rows.length,
    by_status,
    total_rewards_pence,
  };
}

// ---------------------------------------------------------------------------
// getReferrals
// ---------------------------------------------------------------------------

/**
 * Returns all referral rows for the given provider ordered by created_at DESC.
 */
export async function getReferrals(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ProviderReferral[]> {
  const { data, error } = await supabase
    .from("provider_referrals")
    .select("*")
    .eq("referrer_id", providerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderReferral[];
}
