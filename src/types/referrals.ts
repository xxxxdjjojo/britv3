/**
 * Unified referral system types.
 * Replaces types from both referral-service.ts and provider-dashboard.ts.
 *
 * State machine (simplified per eng review 3A):
 *   pending ──► rewarded
 *   (add signed_up/verified when verification system exists)
 */

export const REFERRAL_STATUSES = [
  "pending",      // Referral link used, signup started or completed
  "rewarded",     // First payment made, reward credited
] as const;

export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_TRACKS = [
  "trade_to_trade",
  "trade_to_homeowner",
] as const;

export type ReferralTrack = (typeof REFERRAL_TRACKS)[number];

export const REFERRAL_TIERS = [
  "none",
  "connector",
  "ambassador",
  "champion",
  "partner",
] as const;

export type ReferralTier = (typeof REFERRAL_TIERS)[number];

export const REWARD_STATUSES = [
  "earned",     // Credit calculated, not yet applied
  "applied",    // Stripe balance credit applied
  "failed",     // Stripe API error — queued for retry
  "voided",     // Referral churned within 30 days
] as const;

export type RewardStatus = (typeof REWARD_STATUSES)[number];

export type Referral = Readonly<{
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  track: ReferralTrack;
  status: ReferralStatus;
  referred_name: string | null;
  created_at: string;
  converted_at: string | null;
}>;

export type ReferralReward = Readonly<{
  id: string;
  referral_id: string;
  recipient_id: string;
  reward_type: "subscription_credit";
  amount_pence: number;
  status: RewardStatus;
  stripe_coupon_id: string | null;
  created_at: string;
  applied_at: string | null;
}>;

export type ReferralStats = Readonly<{
  referral_code: string;
  referral_url: string;
  tier: ReferralTier;
  successful_referrals: number;
  pending_referrals: number;
  total_rewards_pence: number;
  next_tier_threshold: number | null;
  referrals: readonly Referral[];
}>;
