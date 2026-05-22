// src/__tests__/services/analytics/pricing-metrics-service.test.ts
//
// MEMO PIVOT v2 — pricing-review analytics dashboard data layer.

import { describe, it, expect, vi } from "vitest";

import {
  computeMrrBySegment,
  computePayingUsers,
  estimateChurnRate,
  MEMO_TARGETS,
  type SubscriptionRow,
} from "@/services/analytics/pricing-metrics-service";

const FAKE_ROWS: ReadonlyArray<SubscriptionRow> = [
  { planId: "agent_pro", priceMonthlyPence: 9900, status: "active" },
  { planId: "agent_elite", priceMonthlyPence: 34900, status: "active" },
  { planId: "provider_pro", priceMonthlyPence: 3900, status: "active" },
  { planId: "provider_elite", priceMonthlyPence: 14900, status: "trialing" },
  { planId: "seller_basic", priceMonthlyPence: 9900, status: "canceled" },
];

describe("computeMrrBySegment", () => {
  it("sums MRR per segment for active subscriptions", () => {
    const mrr = computeMrrBySegment(FAKE_ROWS);
    expect(mrr.agent).toBe(9900 + 34900);
    expect(mrr.provider).toBe(3900);
  });

  it("excludes canceled subscriptions", () => {
    const mrr = computeMrrBySegment(FAKE_ROWS);
    expect(mrr.seller ?? 0).toBe(0);
  });

  it("treats trialing as not-yet-paying for MRR", () => {
    const mrr = computeMrrBySegment(FAKE_ROWS);
    expect(mrr.provider).toBe(3900); // elite trialing excluded
  });
});

describe("computePayingUsers", () => {
  it("counts only active subscriptions", () => {
    expect(computePayingUsers(FAKE_ROWS)).toBe(3);
  });
});

describe("estimateChurnRate", () => {
  it("returns canceled / (active + canceled) over the window", () => {
    const churn = estimateChurnRate(FAKE_ROWS);
    // 1 canceled out of 4 non-trialing observations
    expect(churn).toBeCloseTo(0.25, 2);
  });

  it("returns 0 when no subscriptions are observed", () => {
    expect(estimateChurnRate([])).toBe(0);
  });
});

describe("MEMO_TARGETS", () => {
  it("encodes the memo's three scenarios", () => {
    expect(MEMO_TARGETS.conservative.payingUsers).toBe(120);
    expect(MEMO_TARGETS.base.payingUsers).toBe(600);
    expect(MEMO_TARGETS.bull.payingUsers).toBe(2000);
  });
});
