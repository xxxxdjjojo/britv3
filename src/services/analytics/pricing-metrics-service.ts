// src/services/analytics/pricing-metrics-service.ts
//
// Memo Pivot v2 — analytics for the Week 12-13 pricing-review checkpoint.
// MRR by segment, paying users, conversion proxy, churn estimate.
//
// Tests inject synthetic SubscriptionRow[]; the production data layer
// composes Stripe subscriptions + Supabase rows into the same shape.

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface SubscriptionRow {
  readonly planId: string;
  readonly priceMonthlyPence: number;
  readonly status: SubscriptionStatus;
}

export interface ScenarioTarget {
  readonly payingUsers: number;
  readonly mrrPenceLow: number;
  readonly mrrPenceHigh: number;
}

export const MEMO_TARGETS: Readonly<Record<"conservative" | "base" | "bull", ScenarioTarget>> = {
  conservative: { payingUsers: 120, mrrPenceLow: 1_000_000, mrrPenceHigh: 1_500_000 },
  base:         { payingUsers: 600, mrrPenceLow: 4_000_000, mrrPenceHigh: 6_000_000 },
  bull:         { payingUsers: 2000, mrrPenceLow: 15_000_000, mrrPenceHigh: 999_999_999 },
};

function segmentOf(planId: string): string {
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
  return "other";
}

export function computeMrrBySegment(
  rows: ReadonlyArray<SubscriptionRow>,
): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    if (row.status !== "active") continue;
    const seg = segmentOf(row.planId);
    out[seg] = (out[seg] ?? 0) + row.priceMonthlyPence;
  }
  return out;
}

export function computePayingUsers(rows: ReadonlyArray<SubscriptionRow>): number {
  return rows.filter((r) => r.status === "active").length;
}

export function estimateChurnRate(
  rows: ReadonlyArray<SubscriptionRow>,
): number {
  // Observed-cohort churn = canceled / (active + canceled). Trialing /
  // incomplete are excluded as not-yet-billing observations.
  const nonTrial = rows.filter(
    (r) => r.status === "active" || r.status === "canceled",
  );
  if (nonTrial.length === 0) return 0;
  const canceled = nonTrial.filter((r) => r.status === "canceled").length;
  return canceled / nonTrial.length;
}

export interface PricingMetricsSnapshot {
  readonly capturedAt: string;
  readonly payingUsers: number;
  readonly mrrTotalPence: number;
  readonly mrrBySegment: Readonly<Record<string, number>>;
  readonly churnRate: number;
  readonly targets: typeof MEMO_TARGETS;
}

export function buildSnapshot(
  rows: ReadonlyArray<SubscriptionRow>,
): PricingMetricsSnapshot {
  const mrrBySegment = computeMrrBySegment(rows);
  const mrrTotalPence = Object.values(mrrBySegment).reduce((a, b) => a + b, 0);
  return {
    capturedAt: new Date().toISOString(),
    payingUsers: computePayingUsers(rows),
    mrrTotalPence,
    mrrBySegment,
    churnRate: estimateChurnRate(rows),
    targets: MEMO_TARGETS,
  };
}

/**
 * Production data fetcher — composes Supabase subscription rows into
 * SubscriptionRow[]. Returns empty array on failure so the dashboard
 * still renders.
 */
export async function fetchSubscriptionRows(): Promise<ReadonlyArray<SubscriptionRow>> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, price_monthly_pence, status");
    if (!data) return [];
    return data
      .filter((r): r is { plan_id: string; price_monthly_pence: number; status: SubscriptionStatus } =>
        typeof r.plan_id === "string" &&
        typeof r.price_monthly_pence === "number" &&
        typeof r.status === "string",
      )
      .map((r) => ({
        planId: r.plan_id,
        priceMonthlyPence: r.price_monthly_pence,
        status: r.status,
      }));
  } catch {
    return [];
  }
}
