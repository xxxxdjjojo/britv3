// Shared configuration for the coming-soon waitlist + referral queue.
//
// Client-safe (no "server-only"): imported by both the public components and
// the server-side waitlist service, so all numbers live in one place.

/**
 * Head-start added to the live signup count and to every queue position so the
 * page never reads as empty on day one. Honest framing: this is a *queue
 * position* offset, not a fabricated user count — set it deliberately.
 * Override per-environment with NEXT_PUBLIC_WAITLIST_BASELINE.
 */
export const WAITLIST_BASELINE = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_WAITLIST_BASELINE);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
})();

/**
 * Below this real-signup count, social proof stays generic ("Join the
 * early-access list") instead of quoting a number that looks thin.
 */
export const SOCIAL_PROOF_MIN_DISPLAY = 50;

/** Each confirmed referral moves you this many places up the queue. */
export const REFERRAL_BOOST = 100;

export type RewardTier = Readonly<{
  referrals: number;
  label: string;
  description: string;
}>;

/** Referral milestones shown on the queue page (the viral engine). */
export const REWARD_TIERS: readonly RewardTier[] = [
  {
    referrals: 3,
    label: "Jump to the top 500",
    description: "Refer 3 friends and we move you to the front of the queue.",
  },
  {
    referrals: 10,
    label: "Skip the queue",
    description: "Refer 10 friends for guaranteed first-day access.",
  },
  {
    referrals: 25,
    label: "Lifetime premium",
    description: "Refer 25 friends and unlock TrueDeed premium, free for life.",
  },
] as const;

/** PostHog feature-flag key for the headline A/B/C experiment. */
export const COMING_SOON_EXPERIMENT_FLAG = "coming_soon_headline";

/** Static footer microcopy under the splash. */
export const SPLASH_FOOTER =
  "AI-powered property intelligence. Verified professionals. End-to-end moves.";
