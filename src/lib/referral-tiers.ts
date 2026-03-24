/**
 * Client-safe referral tier definitions.
 *
 * This file does NOT import "server-only" so it can be used in
 * both Server and Client Components (e.g., tier progress bar).
 *
 * Pattern: follows src/lib/plan-entitlements.ts
 */

import type { ReferralTier } from "@/types/referrals";

// ============================================================================
// Tier configuration
// ============================================================================

export type TierConfig = Readonly<{
  threshold: number;
  displayName: string;
  badge: "bronze" | "silver" | "gold" | "platinum";
  freeMonths: number;
  priorityLeadDays: number;
  foundingReferrer: boolean;
  description: string;
}>;

export const TIER_CONFIGS: Readonly<Record<Exclude<ReferralTier, "none">, TierConfig>> = {
  connector: {
    threshold: 1,
    displayName: "Connector",
    badge: "bronze",
    freeMonths: 1,
    priorityLeadDays: 0,
    foundingReferrer: false,
    description: "1 month free for you and your referral",
  },
  ambassador: {
    threshold: 3,
    displayName: "Ambassador",
    badge: "silver",
    freeMonths: 2,
    priorityLeadDays: 7,
    foundingReferrer: false,
    description: "Priority leads + 2 months free",
  },
  champion: {
    threshold: 5,
    displayName: "Champion",
    badge: "gold",
    freeMonths: 3,
    priorityLeadDays: 14,
    foundingReferrer: true,
    description: "Founding Referrer status + 3 months free",
  },
  partner: {
    threshold: 10,
    displayName: "Partner",
    badge: "platinum",
    freeMonths: 5,
    priorityLeadDays: 21,
    foundingReferrer: true,
    description: "Platinum status + 5 months free",
  },
};

// Ordered tiers from lowest to highest
const TIER_ORDER: readonly (Exclude<ReferralTier, "none">)[] = [
  "connector",
  "ambassador",
  "champion",
  "partner",
];

/**
 * Get the tier for a given number of successful referrals.
 * Returns "none" if count is 0.
 */
export function getTierForCount(successfulReferrals: number): ReferralTier {
  if (successfulReferrals <= 0) return "none";

  let result: ReferralTier = "none";
  for (const tier of TIER_ORDER) {
    if (successfulReferrals >= TIER_CONFIGS[tier].threshold) {
      result = tier;
    }
  }
  return result;
}

/**
 * Get the configuration for a specific tier.
 * Throws if called with "none".
 */
export function getTierConfig(tier: Exclude<ReferralTier, "none">): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Get the next tier above the current one, or null if at max.
 * Returns { tier, threshold } for the next tier.
 */
export function getNextTier(
  currentTier: ReferralTier,
): { tier: Exclude<ReferralTier, "none">; threshold: number } | null {
  if (currentTier === "none") {
    return { tier: "connector", threshold: TIER_CONFIGS.connector.threshold };
  }
  const currentIndex = TIER_ORDER.indexOf(currentTier as Exclude<ReferralTier, "none">);
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) return null;
  const nextTier = TIER_ORDER[currentIndex + 1];
  return { tier: nextTier, threshold: TIER_CONFIGS[nextTier].threshold };
}

/**
 * Badge color map for use in UI components.
 */
export const BADGE_COLORS: Record<TierConfig["badge"], { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  silver: { bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-300" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  platinum: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
};
