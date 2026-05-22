// src/__tests__/lib/commission-rates.test.ts
//
// MEMO PIVOT v2 — tier-banded marketplace commission replaces the flat 2.5%.

import { describe, it, expect } from "vitest";

import {
  COMMISSION_RATES_BY_PLAN,
  getCommissionRate,
  DEFAULT_COMMISSION_RATE,
} from "@/lib/commission-rates";

describe("COMMISSION_RATES_BY_PLAN — provider tier banding", () => {
  it("provider_listed → 12%", () => {
    expect(COMMISSION_RATES_BY_PLAN.provider_listed).toBe(0.12);
  });

  it("provider_pro → 10%", () => {
    expect(COMMISSION_RATES_BY_PLAN.provider_pro).toBe(0.10);
  });

  it("provider_elite → 6%", () => {
    expect(COMMISSION_RATES_BY_PLAN.provider_elite).toBe(0.06);
  });

  it("provider_conveyancer / provider_surveyor → 6%", () => {
    expect(COMMISSION_RATES_BY_PLAN.provider_conveyancer).toBe(0.06);
    expect(COMMISSION_RATES_BY_PLAN.provider_surveyor).toBe(0.06);
  });
});

describe("COMMISSION_RATES_BY_PLAN — seller completion fees", () => {
  it("seller_basic 0.50%, seller_plus 0.35%, seller_premium 0.25%, seller_nsnf 1.00%", () => {
    expect(COMMISSION_RATES_BY_PLAN.seller_basic).toBe(0.005);
    expect(COMMISSION_RATES_BY_PLAN.seller_plus).toBe(0.0035);
    expect(COMMISSION_RATES_BY_PLAN.seller_premium).toBe(0.0025);
    expect(COMMISSION_RATES_BY_PLAN.seller_nsnf).toBe(0.01);
  });
});

describe("COMMISSION_RATES_BY_PLAN — developer fees", () => {
  it("developer_single 0.25%, developer_multi 0.20%, developer_enterprise 0.15%", () => {
    expect(COMMISSION_RATES_BY_PLAN.developer_single).toBe(0.0025);
    expect(COMMISSION_RATES_BY_PLAN.developer_multi).toBe(0.0020);
    expect(COMMISSION_RATES_BY_PLAN.developer_enterprise).toBe(0.0015);
  });
});

describe("COMMISSION_RATES_BY_PLAN — trader fees", () => {
  it("trader_pro and trader_elite both 0.50% on resale", () => {
    expect(COMMISSION_RATES_BY_PLAN.trader_pro).toBe(0.005);
    expect(COMMISSION_RATES_BY_PLAN.trader_elite).toBe(0.005);
  });
});

describe("getCommissionRate", () => {
  it("returns the per-plan rate for a known plan id", () => {
    expect(getCommissionRate("provider_pro")).toBe(0.10);
  });

  it("falls back to DEFAULT_COMMISSION_RATE for unknown ids", () => {
    expect(getCommissionRate("__unknown__")).toBe(DEFAULT_COMMISSION_RATE);
  });

  it("DEFAULT_COMMISSION_RATE is the most conservative rate (provider_listed, 12%)", () => {
    expect(DEFAULT_COMMISSION_RATE).toBe(0.12);
  });
});
