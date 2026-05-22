// src/lib/plan-entitlements.ts

/**
 * Client-safe plan → feature mapping.
 *
 * This file does NOT import "server-only" so it can be used in
 * both Server and Client Components (e.g., upgrade prompts).
 *
 * Higher tiers inherit all features from lower tiers within the same role.
 */

import type { FeatureKey } from "@/types/entitlements";

// ============================================================================
// Provider tier entitlements
// ============================================================================

const PROVIDER_MEMBER: readonly FeatureKey[] = [
  "QUOTES_BASIC",
  "LEADS_STANDARD",
  "PROFILE_BASIC",
  "ANALYTICS_BASIC",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const PROVIDER_PROFESSIONAL: readonly FeatureKey[] = [
  ...PROVIDER_MEMBER,
  "QUOTES_UNLIMITED",
  "LEADS_PRIORITY",
  "PROFILE_FEATURED",
  "BOOKING_SYSTEM",
  "CRM_BASIC",
  "FOLLOW_UPS_AUTO",
  "ANALYTICS_ADVANCED",
  "SUPPORT_PRIORITY",
];

const PROVIDER_ELITE: readonly FeatureKey[] = [
  ...PROVIDER_PROFESSIONAL,
  "LEADS_FIRST_ACCESS",
  "PROFILE_PREMIUM_BADGE",
  "CRM_ADVANCED",
  "SUPPORT_DEDICATED",
  "TEAM_MULTI_USER",
  "API_ACCESS",
  "WHITE_LABEL",
  "RECRUITMENT",
];

// ============================================================================
// Agent tier entitlements
// ============================================================================

const AGENT_PERFORMANCE: readonly FeatureKey[] = [
  "LISTINGS_25",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const AGENT_PROFESSIONAL: readonly FeatureKey[] = [
  ...AGENT_PERFORMANCE,
  "LISTINGS_UNLIMITED",
  "AGENT_CRM",
  "AGENT_VIEWING_CALENDAR",
  "AGENT_OFFER_MGMT",
  "SUPPORT_PRIORITY",
];

const AGENT_ENTERPRISE: readonly FeatureKey[] = [
  ...AGENT_PROFESSIONAL,
  "LISTINGS_MULTI_BRANCH",
  "AGENT_TEAM_ACCOUNTS",
  "AGENT_API_ACCESS",
  "AGENT_CUSTOM_BRANDING",
  "SUPPORT_DEDICATED",
];

// ============================================================================
// Landlord tier entitlements
// ============================================================================

const LANDLORD_ESSENTIAL: readonly FeatureKey[] = [
  "PROPERTIES_3",
  "TENANT_SCREENING_BASIC",
  "MAINTENANCE_BASIC",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const LANDLORD_PROFESSIONAL: readonly FeatureKey[] = [
  ...LANDLORD_ESSENTIAL,
  "PROPERTIES_UNLIMITED",
  "TENANT_SCREENING_ADV",
  "RENT_COLLECTION",
  "MAINTENANCE_WORKFLOWS",
  "FINANCIAL_REPORTING",
  "SUPPORT_PRIORITY",
];

// ============================================================================
// Memo Pivot v2 — entitlement bundles for new segments
// ============================================================================

const SELLER_TIER: readonly FeatureKey[] = [
  "PROFILE_BASIC",
  "SUPPORT_EMAIL",
];

const SELLER_PLUS_TIER: readonly FeatureKey[] = [
  ...SELLER_TIER,
  "PROFILE_FEATURED",
  "SUPPORT_PRIORITY",
];

const SELLER_PREMIUM_TIER: readonly FeatureKey[] = [
  ...SELLER_PLUS_TIER,
  "PROFILE_PREMIUM_BADGE",
  "SUPPORT_DEDICATED",
];

const LANDLORD_FREE_TIER: readonly FeatureKey[] = [
  "SUPPORT_EMAIL",
];

const LANDLORD_PORTFOLIO_TIER: readonly FeatureKey[] = [
  ...LANDLORD_PROFESSIONAL,
  "TEAM_MULTI_USER",
  "API_ACCESS",
  "SUPPORT_DEDICATED",
];

const PROVIDER_LISTED_TIER: readonly FeatureKey[] = [
  "QUOTES_BASIC",
  "LEADS_STANDARD",
  "PROFILE_BASIC",
  "SUPPORT_EMAIL",
];

const PROVIDER_NICHE_TIER: readonly FeatureKey[] = [
  ...PROVIDER_PROFESSIONAL,
  "PROFILE_PREMIUM_BADGE",
];

const DEVELOPER_BASE_TIER: readonly FeatureKey[] = [
  "PROFILE_FEATURED",
  "LEADS_STANDARD",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const DEVELOPER_MULTI_TIER: readonly FeatureKey[] = [
  ...DEVELOPER_BASE_TIER,
  "LEADS_PRIORITY",
  "ANALYTICS_ADVANCED",
  "SUPPORT_PRIORITY",
];

const DEVELOPER_ENTERPRISE_TIER: readonly FeatureKey[] = [
  ...DEVELOPER_MULTI_TIER,
  "API_ACCESS",
  "TEAM_MULTI_USER",
  "SUPPORT_DEDICATED",
  "WHITE_LABEL",
];

const TRADER_PRO_TIER: readonly FeatureKey[] = [
  "PROFILE_FEATURED",
  "LEADS_PRIORITY",
  "ANALYTICS_BASIC",
  "SUPPORT_EMAIL",
];

const TRADER_ELITE_TIER: readonly FeatureKey[] = [
  ...TRADER_PRO_TIER,
  "LEADS_FIRST_ACCESS",
  "API_ACCESS",
  "SUPPORT_PRIORITY",
];

// ============================================================================
// Plan ID → feature set map
// Includes both legacy IDs (for in-flight subscriptions) and new memo-v2 IDs.
// ============================================================================

const PLAN_ENTITLEMENTS: Record<string, readonly FeatureKey[]> = {
  // --- Provider (legacy) ---
  provider_member: PROVIDER_MEMBER,
  provider_professional: PROVIDER_PROFESSIONAL,
  // --- Provider (memo v2) ---
  provider_listed: PROVIDER_LISTED_TIER,
  provider_pro: PROVIDER_PROFESSIONAL,
  provider_elite: PROVIDER_ELITE,
  provider_conveyancer: PROVIDER_NICHE_TIER,
  provider_surveyor: PROVIDER_NICHE_TIER,
  provider_mortgage_broker: PROVIDER_NICHE_TIER,

  // --- Agent (legacy) ---
  agent_performance: AGENT_PERFORMANCE,
  agent_professional: AGENT_PROFESSIONAL,
  agent_enterprise: AGENT_ENTERPRISE,
  // --- Agent (memo v2) ---
  agent_listed: AGENT_PERFORMANCE,
  agent_pro: AGENT_PROFESSIONAL,
  agent_elite: AGENT_ENTERPRISE,

  // --- Landlord (legacy) ---
  landlord_ess: LANDLORD_ESSENTIAL,
  // --- Landlord (memo v2) ---
  landlord_free: LANDLORD_FREE_TIER,
  landlord_essential: LANDLORD_ESSENTIAL,
  landlord_pro: LANDLORD_PROFESSIONAL,
  landlord_portfolio: LANDLORD_PORTFOLIO_TIER,

  // --- Sellers (memo v2 — new segment) ---
  seller_basic: SELLER_TIER,
  seller_plus: SELLER_PLUS_TIER,
  seller_premium: SELLER_PREMIUM_TIER,
  seller_nsnf: SELLER_TIER,

  // --- Developers (memo v2 — new segment) ---
  developer_single: DEVELOPER_BASE_TIER,
  developer_multi: DEVELOPER_MULTI_TIER,
  developer_enterprise: DEVELOPER_ENTERPRISE_TIER,

  // --- Traders (memo v2 — new segment) ---
  trader_pro: TRADER_PRO_TIER,
  trader_elite: TRADER_ELITE_TIER,
};

// ============================================================================
// Legacy plan ID aliases
// [ENG REVIEW 5A] — old plan IDs from before the pricing rename.
// Existing subscription rows may still have these. Resolve to new IDs
// so entitlements work for users who subscribed before the rename.
// ============================================================================

const LEGACY_PLAN_IDS: Record<string, string> = {
  agent_basic: "agent_performance",
  agent_pro: "agent_professional",
  agent_ent: "agent_enterprise",
  provider_starter: "provider_member",
  provider_growth: "provider_professional",
};

/**
 * Get the set of features available to a given plan.
 * Returns empty set for null/unknown plans.
 * Resolves legacy plan IDs via LEGACY_PLAN_IDS alias map.
 */
export function getEntitlementsForPlan(
  planId: string | null,
): ReadonlySet<FeatureKey> {
  if (!planId) return new Set();
  const resolvedId = LEGACY_PLAN_IDS[planId] ?? planId;
  const features = PLAN_ENTITLEMENTS[resolvedId];
  if (!features) return new Set();
  return new Set(features);
}

/**
 * Check if a plan includes a specific feature.
 * Convenience wrapper around getEntitlementsForPlan.
 */
export function hasFeature(
  planId: string | null,
  feature: FeatureKey,
): boolean {
  return getEntitlementsForPlan(planId).has(feature);
}

/**
 * Get the minimum plan for a role that includes a given feature.
 * Useful for upgrade prompts: "Upgrade to [plan] to unlock [feature]".
 */
export function getMinimumPlanForFeature(
  role: "provider" | "agent" | "landlord",
  feature: FeatureKey,
): string | null {
  const rolePrefixes: Record<string, string[]> = {
    provider: ["provider_member", "provider_professional", "provider_elite"],
    agent: ["agent_performance", "agent_professional", "agent_enterprise"],
    landlord: ["landlord_ess", "landlord_pro"],
  };

  const planIds = rolePrefixes[role];
  if (!planIds) return null;

  for (const planId of planIds) {
    if (hasFeature(planId, feature)) return planId;
  }
  return null;
}
