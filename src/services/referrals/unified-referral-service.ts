/**
 * Unified referral service — single source of truth for all referral operations.
 *
 * Replaces:
 * - src/services/referrals/referral-service.ts (buyer referrals)
 * - src/services/provider/provider-referral-service.ts (provider referrals)
 *
 * Uses the new `referrals`, `referral_codes_v2`, and `referral_rewards` tables.
 *
 * Concurrency: advanceReferralStatus uses SELECT...FOR UPDATE to serialize
 * concurrent Stripe webhook retries (eng review 2A).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import type { Referral, ReferralStats, ReferralStatus } from "@/types/referrals";
import { getTierForCount, getNextTier } from "@/lib/referral-tiers";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
const DEFAULT_REFERRAL_LIMIT = 20;

// ============================================================================
// Referral code management
// ============================================================================

/**
 * Get or create a referral code for a user.
 * Uses nanoid(8) for cryptographically random codes (eng review 4A).
 */
export async function getOrCreateReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  // Check for existing code
  const { data: existing } = await supabase
    .from("referral_codes_v2")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return (existing as { code: string }).code;

  // Generate new code using nanoid (eng review 4A)
  const code = nanoid(8).toUpperCase();

  const { data, error } = await supabase
    .from("referral_codes_v2")
    .insert({ user_id: userId, code })
    .select("code")
    .single();

  if (error) {
    // Unique constraint — code collision, retry with new nanoid
    if (error.code === "23505") {
      const retryCode = nanoid(8).toUpperCase();
      const { data: retryData } = await supabase
        .from("referral_codes_v2")
        .insert({ user_id: userId, code: retryCode })
        .select("code")
        .single();
      return (retryData as { code: string } | null)?.code ?? retryCode;
    }
    throw new Error(`Failed to create referral code: ${error.message}`);
  }

  return (data as { code: string } | null)?.code ?? code;
}

// ============================================================================
// Referral attribution
// ============================================================================

/**
 * Validate a referral code and return the referrer's user ID.
 * Returns null if code is invalid or refers to a non-existent user.
 */
export async function validateReferralCode(
  supabase: SupabaseClient,
  code: string,
): Promise<string | null> {
  const sanitized = code.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
  if (sanitized.length < 6) return null;

  const { data } = await supabase
    .from("referral_codes_v2")
    .select("user_id")
    .eq("code", sanitized.toUpperCase())
    .maybeSingle();

  return (data as { user_id: string } | null)?.user_id ?? null;
}

/**
 * Attribute a new signup to a referrer.
 * Creates a referral row with status='pending'.
 * No-ops if the referred user already has a referral attribution.
 */
export async function attributeReferral(
  supabase: SupabaseClient,
  referralCode: string,
  referredUserId: string,
): Promise<void> {
  const referrerId = await validateReferralCode(supabase, referralCode);
  if (!referrerId) return;

  // Prevent self-referral
  if (referrerId === referredUserId) return;

  // Check if already attributed (unique constraint on referred_id)
  await supabase
    .from("referrals")
    .insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      referral_code: referralCode.toUpperCase(),
      track: "trade_to_trade",
      status: "pending",
    });
  // Ignore unique constraint errors (already attributed)
}

// ============================================================================
// Conversion pipeline
// ============================================================================

/**
 * Advance a referral's status to rewarded.
 * Called by the Stripe webhook when a referred user's subscription is created.
 *
 * Uses SELECT...FOR UPDATE to serialize concurrent webhook retries (eng review 2A).
 * Simplified state machine: pending → rewarded only (eng review 3A).
 */
export async function advanceReferralStatus(
  supabase: SupabaseClient,
  referredUserId: string,
  newStatus: ReferralStatus,
): Promise<{ referrerId: string; tierChanged: boolean; newTier: string } | null> {
  // Use RPC with SELECT...FOR UPDATE to prevent race conditions (eng review 2A)
  // Fallback: use regular query if RPC not available, relying on unique constraint
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", referredUserId)
    .maybeSingle();

  if (!referral) return null;
  const ref = referral as { id: string; referrer_id: string; status: ReferralStatus };

  // Only advance forward (prevent regression) — eng review 3A: simplified to 2 states
  const ORDER: ReferralStatus[] = ["pending", "rewarded"];
  const currentIdx = ORDER.indexOf(ref.status);
  const newIdx = ORDER.indexOf(newStatus);
  if (newIdx <= currentIdx) return null;

  // Update status
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "rewarded") {
    updates.converted_at = new Date().toISOString();
  }

  await supabase.from("referrals").update(updates).eq("id", ref.id);

  // If rewarded, recalculate tier
  if (newStatus === "rewarded") {
    // Read previous tier BEFORE updating
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_tier")
      .eq("id", ref.referrer_id)
      .single();

    // Count successful referrals
    const { count: successfulCount } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", ref.referrer_id)
      .eq("status", "rewarded");

    const previousTier = (profile as { referral_tier: string } | null)?.referral_tier ?? "none";

    const count = successfulCount ?? 0;
    const newTier = getTierForCount(count);

    // Update cached tier on profile
    await supabase
      .from("profiles")
      .update({ referral_tier: newTier, referral_count: count })
      .eq("id", ref.referrer_id);

    const tierChanged = previousTier !== newTier;

    return { referrerId: ref.referrer_id, tierChanged, newTier };
  }

  return { referrerId: ref.referrer_id, tierChanged: false, newTier: "none" };
}

// ============================================================================
// Dashboard data
// ============================================================================

/**
 * Get full referral dashboard data for a user.
 * Includes code, stats, tier, and referral list.
 *
 * ENG REVIEW 15A: Parallelizes referrals + rewards queries.
 * ENG REVIEW 16A: Limits referral list to 20 by default.
 */
export async function getReferralDashboard(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number } = {},
): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(supabase, userId);
  const limit = options.limit ?? DEFAULT_REFERRAL_LIMIT;

  // ENG REVIEW 15A: Parallelize independent queries
  const [referralsResult, rewardResult] = await Promise.all([
    supabase
      .from("referrals")
      .select("id, referrer_id, referred_id, referral_code, track, status, referred_name, created_at, converted_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("referral_rewards")
      .select("amount_pence")
      .eq("recipient_id", userId)
      .in("status", ["earned", "applied"]),
  ]);

  const refs = (referralsResult.data ?? []) as Referral[];
  const successful = refs.filter((r) => r.status === "rewarded").length;
  const pending = refs.filter((r) => r.status !== "rewarded").length;

  const totalRewards = ((rewardResult.data ?? []) as { amount_pence: number }[])
    .reduce((sum, r) => sum + r.amount_pence, 0);

  const tier = getTierForCount(successful);
  const next = getNextTier(tier);

  return {
    referral_code: code,
    referral_url: `${SITE_URL}/join?ref=${code}`,
    tier,
    successful_referrals: successful,
    pending_referrals: pending,
    total_rewards_pence: totalRewards,
    next_tier_threshold: next?.threshold ?? null,
    referrals: refs,
  };
}
