import { describe, expect, it } from "vitest";
import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";
import { buildPortalCostEstimate, UK_REGIONS } from "@/lib/calculators/portal-cost";

describe("buildPortalCostEstimate", () => {
  it("computes exact outputs for known inputs with default assumptions", () => {
    // Defaults: ARPA £1,431/month, 10 listings/branch/month, 1.2%–1.8% commission.
    const estimate = buildPortalCostEstimate({
      askingPrice: 300_000,
      region: "london",
    });

    expect(estimate.portalCostPerListing).toBeCloseTo(143.1, 10); // 1431 / 10
    expect(estimate.commissionLow).toBe(3_600); // 300000 * 0.012
    expect(estimate.commissionHigh).toBe(5_400); // 300000 * 0.018
    expect(estimate.shareOfCommissionLowPct).toBeCloseTo((143.1 / 5_400) * 100, 10);
    expect(estimate.shareOfCommissionHighPct).toBeCloseTo((143.1 / 3_600) * 100, 10);
    expect(estimate.monthlyPortalSpend).toBe(1_431);
    expect(estimate.agencySizeBranches).toBe(1);
    expect(estimate.region).toBe("london");
    expect(estimate.askingPrice).toBe(300_000);
  });

  it("echoes back exactly the assumptions used (defaults from config)", () => {
    const estimate = buildPortalCostEstimate({
      askingPrice: 250_000,
      region: "wales",
    });

    expect(estimate.assumptions).toEqual({
      arpaMonthly: PORTAL_COST_ASSUMPTIONS.arpaMonthly.value,
      listingsPerBranchMonthly:
        PORTAL_COST_ASSUMPTIONS.listingsPerBranchMonthly.value,
      commissionRateLow: PORTAL_COST_ASSUMPTIONS.commissionRateLow.value,
      commissionRateHigh: PORTAL_COST_ASSUMPTIONS.commissionRateHigh.value,
    });
  });

  it("plumbs overrides through and echoes them back", () => {
    const estimate = buildPortalCostEstimate({
      askingPrice: 400_000,
      region: "scotland",
      agencySizeBranches: 3,
      overrides: {
        arpaMonthly: 1_500,
        listingsPerBranchMonthly: 15,
        commissionRateLow: 0.01,
        commissionRateHigh: 0.02,
      },
    });

    expect(estimate.portalCostPerListing).toBe(100); // 1500 / 15
    expect(estimate.commissionLow).toBe(4_000);
    expect(estimate.commissionHigh).toBe(8_000);
    expect(estimate.shareOfCommissionLowPct).toBe(1.25); // 100/8000
    expect(estimate.shareOfCommissionHighPct).toBe(2.5); // 100/4000
    expect(estimate.monthlyPortalSpend).toBe(4_500); // 1500 * 3 branches
    expect(estimate.assumptions).toEqual({
      arpaMonthly: 1_500,
      listingsPerBranchMonthly: 15,
      commissionRateLow: 0.01,
      commissionRateHigh: 0.02,
    });
  });

  it("region never changes the maths (no fabricated regional variation)", () => {
    const [first, ...rest] = UK_REGIONS.map((r) =>
      buildPortalCostEstimate({ askingPrice: 350_000, region: r.value }),
    );
    for (const other of rest) {
      expect(other.portalCostPerListing).toBe(first.portalCostPerListing);
      expect(other.commissionLow).toBe(first.commissionLow);
      expect(other.commissionHigh).toBe(first.commissionHigh);
      expect(other.shareOfCommissionLowPct).toBe(first.shareOfCommissionLowPct);
    }
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid asking price %s",
    (askingPrice) => {
      expect(() =>
        buildPortalCostEstimate({ askingPrice, region: "london" }),
      ).toThrow(RangeError);
    },
  );

  it("rejects zero/negative overrides", () => {
    const base = { askingPrice: 300_000, region: "london" as const };
    expect(() =>
      buildPortalCostEstimate({ ...base, overrides: { listingsPerBranchMonthly: 0 } }),
    ).toThrow(RangeError);
    expect(() =>
      buildPortalCostEstimate({ ...base, overrides: { arpaMonthly: -5 } }),
    ).toThrow(RangeError);
    expect(() =>
      buildPortalCostEstimate({ ...base, overrides: { commissionRateLow: 0 } }),
    ).toThrow(RangeError);
    expect(() =>
      buildPortalCostEstimate({ ...base, agencySizeBranches: -2 }),
    ).toThrow(RangeError);
  });

  it("rejects a low commission rate above the high rate", () => {
    expect(() =>
      buildPortalCostEstimate({
        askingPrice: 300_000,
        region: "london",
        overrides: { commissionRateLow: 0.02, commissionRateHigh: 0.01 },
      }),
    ).toThrow(RangeError);
  });
});
