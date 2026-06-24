// src/lib/experiments.ts
//
// Lightweight experiment harness — thin wrapper around PostHog feature flags.
// Memo Pivot v2 introduces the Sellers default-tier A/B (basic vs plus).
//
// This file is client-safe — it must not import "server-only" because both
// SSR exposure tracking AND client-side PricingTabs read from it.

export const SELLERS_DEFAULT_TIER_EXPERIMENT = {
  key: "sellers_default_tier",
  variants: ["basic", "plus"] as const,
  controlVariant: "basic" as const,
} as const;

export type SellersDefaultTierVariant =
  (typeof SELLERS_DEFAULT_TIER_EXPERIMENT.variants)[number];

/**
 * Map each variant key to the seller plan id it should highlight on
 * the pricing page.
 */
export const EXPERIMENT_VARIANTS: Readonly<
  Record<SellersDefaultTierVariant, string>
> = {
  basic: "seller_basic",
  plus: "seller_plus",
};

interface MinimalPostHogClient {
  getFeatureFlag?: (flag: string) => string | boolean | null | undefined;
  capture?: (event: string, props?: Record<string, unknown>) => void;
}

/**
 * Resolve the current variant for the Sellers default-tier experiment.
 * Falls back to the control variant when PostHog is unavailable or
 * returns an unknown variant.
 */
export function resolveSellersDefaultTier(
  client: MinimalPostHogClient | null | undefined,
): SellersDefaultTierVariant {
  const fallback = SELLERS_DEFAULT_TIER_EXPERIMENT.controlVariant;
  if (!client?.getFeatureFlag) return fallback;
  const raw = client.getFeatureFlag(SELLERS_DEFAULT_TIER_EXPERIMENT.key);
  if (typeof raw !== "string") return fallback;
  return SELLERS_DEFAULT_TIER_EXPERIMENT.variants.includes(
    raw as SellersDefaultTierVariant,
  )
    ? (raw as SellersDefaultTierVariant)
    : fallback;
}

// ----------------------------------------------------------------------------
// Exposure reporting with per-session dedup
// ----------------------------------------------------------------------------

const exposureCache = new Map<string, Set<string>>();

interface ExposureOptions {
  /** Used to dedupe exposures within a session-like scope. */
  readonly sessionKey?: string;
}

export function reportExperimentExposure(
  client: MinimalPostHogClient | null | undefined,
  flag: string,
  variant: string,
  options: ExposureOptions = {},
): void {
  if (!client?.capture) return;
  const sessionKey = options.sessionKey ?? "default";
  let seen = exposureCache.get(sessionKey);
  if (!seen) {
    seen = new Set();
    exposureCache.set(sessionKey, seen);
  }
  const cacheKey = `${flag}:${variant}`;
  if (seen.has(cacheKey)) return;
  seen.add(cacheKey);
  client.capture("$feature_flag_called", {
    $feature_flag: flag,
    $feature_flag_response: variant,
  });
}

/**
 * Test-only — wipes the exposure dedup cache. Not exported for runtime use.
 */
export function __resetExperimentCacheForTests(): void {
  exposureCache.clear();
}

// ----------------------------------------------------------------------------
// Coming Soon headline A/B (waitlist splash)
// ----------------------------------------------------------------------------

export const COMING_SOON_HEADLINE_EXPERIMENT = {
  key: "coming_soon_headline",
  variants: ["A", "B", "C"] as const,
  controlVariant: "B" as const,
} as const;

export type ComingSoonHeadlineVariant =
  (typeof COMING_SOON_HEADLINE_EXPERIMENT.variants)[number];

export function resolveComingSoonHeadline(
  client: MinimalPostHogClient | null | undefined,
): ComingSoonHeadlineVariant {
  const fallback = COMING_SOON_HEADLINE_EXPERIMENT.controlVariant;
  if (!client?.getFeatureFlag) return fallback;
  const raw = client.getFeatureFlag(COMING_SOON_HEADLINE_EXPERIMENT.key);
  if (typeof raw !== "string") return fallback;
  return COMING_SOON_HEADLINE_EXPERIMENT.variants.includes(
    raw as ComingSoonHeadlineVariant,
  )
    ? (raw as ComingSoonHeadlineVariant)
    : fallback;
}
