/**
 * Tier-banded commission rates introduced by the memo pivot (v2).
 *
 * Replaces the flat 2.5% PLATFORM_FEE_RATE that previously lived in
 * provider-payment-service.ts. Higher-tier providers self-select up the
 * ladder for lower per-job commission; sellers and developers see
 * completion-fee bands; traders pay a flat 0.50% on resale.
 *
 * This file is intentionally client-safe (no "server-only" import) so
 * components can render commission labels without an extra hop.
 */

import type { Segment } from "@/lib/billing-config";

/**
 * The default rate applied when a planId cannot be resolved. We pick the
 * highest (most conservative) rate so unknown ids never under-charge.
 */
export const DEFAULT_COMMISSION_RATE = 0.12;

export const COMMISSION_RATES_BY_PLAN: Readonly<Record<string, number>> = {
  // Sellers — applied at completion
  seller_basic: 0.005,
  seller_plus: 0.0035,
  seller_premium: 0.0025,
  seller_nsnf: 0.01,

  // Providers — applied per-job
  provider_listed: 0.12,
  provider_pro: 0.10,
  provider_elite: 0.06,
  provider_conveyancer: 0.06,
  provider_surveyor: 0.06,
  // mortgage broker is flat per-lead — no percentage commission

  // Developers — applied at completion
  developer_single: 0.0025,
  developer_multi: 0.0020,
  developer_enterprise: 0.0015,

  // Traders — applied on resale
  trader_pro: 0.005,
  trader_elite: 0.005,
};

/**
 * Resolve the commission rate for a given plan id. Returns
 * DEFAULT_COMMISSION_RATE when the id is unknown.
 */
export function getCommissionRate(planId: string | null | undefined): number {
  if (!planId) return DEFAULT_COMMISSION_RATE;
  const rate = COMMISSION_RATES_BY_PLAN[planId];
  return rate ?? DEFAULT_COMMISSION_RATE;
}

/**
 * Display-friendly percentage string for a plan.
 * Example: getCommissionRateLabel("provider_pro") === "10%"
 */
export function getCommissionRateLabel(
  planId: string | null | undefined,
): string {
  const rate = getCommissionRate(planId);
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%`;
}

/**
 * Best-effort segment lookup for grouping plans on the fee-transparency page.
 * Not exhaustive — pages that need the segment should query billing-config directly.
 */
export function getCommissionSegment(planId: string): Segment | null {
  if (planId.startsWith("seller_")) return "seller";
  if (planId.startsWith("agent_")) return "agent";
  if (planId.startsWith("landlord_")) return "landlord";
  if (planId.startsWith("developer_")) return "developer";
  if (planId.startsWith("trader_")) return "trader";
  if (
    planId === "provider_conveyancer" ||
    planId === "provider_surveyor" ||
    planId === "provider_mortgage_broker"
  ) {
    return "provider_niche";
  }
  if (planId.startsWith("provider_")) return "provider";
  return null;
}
