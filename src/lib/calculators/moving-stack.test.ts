import { describe, expect, it } from "vitest";
import type { BuyerType } from "@/types/calculators";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import { calculateLbtt } from "@/lib/calculators/lbtt";
import { calculateLtt } from "@/lib/calculators/ltt";
import { buildPortalCostEstimate } from "@/lib/calculators/portal-cost";
import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";
import { SELLER_PLANS } from "@/lib/billing-config";
import {
  buildMovingStack,
  buildTrueDeedComparison,
  type MovingStackInput,
  type SellerPlanSummary,
} from "@/lib/calculators/moving-stack";

// The same server-side mapping the page performs: fee numbers come straight
// from billing-config constants, never re-hardcoded here.
const PLAN_SUMMARIES: ReadonlyArray<SellerPlanSummary> = SELLER_PLANS.map(
  (plan) => ({
    id: plan.id,
    name: plan.name,
    priceMonthlyPence: plan.priceMonthly,
    commissionRate: plan.commissionRate ?? 0,
    commissionLabel: plan.commissionLabel,
  }),
);

const BASE_INPUT: MovingStackInput = {
  propertyPrice: 300000,
  location: "england",
  buyerType: "standard",
  selling: false,
};

function itemByKey(input: MovingStackInput, key: string) {
  return buildMovingStack(input).items.find((item) => item.key === key);
}

describe("buildMovingStack", () => {
  describe("SDLT parity — single source of truth", () => {
    const prices = [125000, 300000, 500000, 1000000];
    const buyerTypes: BuyerType[] = ["standard", "first_time", "additional"];

    for (const price of prices) {
      for (const buyerType of buyerTypes) {
        it(`England £${price} ${buyerType} equals calculateSdlt exactly`, () => {
          const expected = calculateSdlt(price, buyerType).totalTax;
          const item = itemByKey(
            { ...BASE_INPUT, propertyPrice: price, buyerType },
            "stamp_duty",
          );
          expect(item?.low).toBe(expected);
          expect(item?.high).toBe(expected);
          expect(item?.kind).toBe("tax");
        });
      }
    }

    it("Scotland delegates to calculateLbtt (first-time relief respected)", () => {
      const standard = itemByKey(
        { ...BASE_INPUT, location: "scotland", buyerType: "standard" },
        "stamp_duty",
      );
      const firstTime = itemByKey(
        { ...BASE_INPUT, location: "scotland", buyerType: "first_time" },
        "stamp_duty",
      );
      expect(standard?.low).toBe(calculateLbtt(300000, false).totalTax);
      expect(firstTime?.low).toBe(calculateLbtt(300000, true).totalTax);
    });

    it("Wales delegates to calculateLtt", () => {
      const item = itemByKey({ ...BASE_INPUT, location: "wales" }, "stamp_duty");
      expect(item?.low).toBe(calculateLtt(300000).totalTax);
    });

    it("Northern Ireland uses SDLT like England", () => {
      const item = itemByKey({ ...BASE_INPUT, location: "ni" }, "stamp_duty");
      expect(item?.low).toBe(calculateSdlt(300000, "standard").totalTax);
    });
  });

  describe("totals arithmetic", () => {
    it("buying-only totals = tax + conveyancing + survey + removals bounds", () => {
      const tax = calculateSdlt(300000, "standard").totalTax;
      const { items, totalLow, totalHigh } = buildMovingStack(BASE_INPUT);

      expect(items.map((i) => i.key)).toEqual([
        "stamp_duty",
        "conveyancing",
        "survey",
        "removals",
      ]);
      expect(totalLow).toBe(tax + 1200 + 300 + 500);
      expect(totalHigh).toBe(tax + 1800 + 700 + 1500);
    });

    it("selling totals include EPC, commission range, and portal estimate — tax counted once", () => {
      const input: MovingStackInput = { ...BASE_INPUT, selling: true };
      const { items, totalLow, totalHigh } = buildMovingStack(input);

      const tax = calculateSdlt(300000, "standard").totalTax;
      const portal = buildPortalCostEstimate({
        askingPrice: 300000,
        region: "london",
      }).portalCostPerListing;
      const commissionLow =
        300000 * PORTAL_COST_ASSUMPTIONS.commissionRateLow.value;
      const commissionHigh =
        300000 * PORTAL_COST_ASSUMPTIONS.commissionRateHigh.value;

      expect(items.filter((i) => i.key === "stamp_duty")).toHaveLength(1);
      expect(totalLow).toBe(tax + 1200 + 300 + 500 + 60 + commissionLow + portal);
      expect(totalHigh).toBe(
        tax + 1800 + 700 + 1500 + 120 + commissionHigh + portal,
      );
    });
  });

  describe("selling-only line items", () => {
    it("excludes EPC, commission, and portal when not selling", () => {
      const keys = buildMovingStack(BASE_INPUT).items.map((i) => i.key);
      expect(keys).not.toContain("epc");
      expect(keys).not.toContain("agent_commission");
      expect(keys).not.toContain("portal_passthrough");
    });

    it("includes them when selling, with the portal line labelled an estimate", () => {
      const items = buildMovingStack({ ...BASE_INPUT, selling: true }).items;
      const keys = items.map((i) => i.key);
      expect(keys).toContain("epc");
      expect(keys).toContain("agent_commission");
      expect(keys).toContain("portal_passthrough");

      const portal = items.find((i) => i.key === "portal_passthrough");
      expect(portal?.kind).toBe("estimate");
      expect(portal?.note).toContain("/tools/portal-cost-calculator");
    });

    it("applies an agent commission override as an exact fee", () => {
      const item = itemByKey(
        { ...BASE_INPUT, selling: true, agentCommissionRate: 0.02 },
        "agent_commission",
      );
      expect(item?.low).toBe(300000 * 0.02);
      expect(item?.high).toBe(300000 * 0.02);
      expect(item?.kind).toBe("fee");
    });

    it("defaults the commission range to the sourced portal-cost-assumptions rates", () => {
      const item = itemByKey({ ...BASE_INPUT, selling: true }, "agent_commission");
      expect(item?.low).toBe(
        300000 * PORTAL_COST_ASSUMPTIONS.commissionRateLow.value,
      );
      expect(item?.high).toBe(
        300000 * PORTAL_COST_ASSUMPTIONS.commissionRateHigh.value,
      );
    });
  });

  describe("no fabricated numbers", () => {
    it("every line item carries a source URL or an explicit note", () => {
      const items = buildMovingStack({ ...BASE_INPUT, selling: true }).items;
      for (const item of items) {
        expect(
          Boolean(item.source?.url) || Boolean(item.note),
          `${item.key} must have a source or note`,
        ).toBe(true);
      }
    });

    it("sourced items use real https URLs", () => {
      const items = buildMovingStack({ ...BASE_INPUT, selling: true }).items;
      for (const item of items) {
        if (item.source) {
          expect(item.source.url).toMatch(/^https:\/\//);
          expect(item.source.label.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("input validation", () => {
    it("rejects non-positive prices", () => {
      expect(() =>
        buildMovingStack({ ...BASE_INPUT, propertyPrice: 0 }),
      ).toThrow(RangeError);
    });

    it("rejects out-of-range commission overrides", () => {
      expect(() =>
        buildMovingStack({ ...BASE_INPUT, selling: true, agentCommissionRate: 1.5 }),
      ).toThrow(RangeError);
    });
  });
});

describe("buildTrueDeedComparison", () => {
  it("computes each tier from the imported billing-config constants", () => {
    const price = 300000;
    const { tiers } = buildTrueDeedComparison(price, PLAN_SUMMARIES);

    expect(tiers).toHaveLength(SELLER_PLANS.length);
    for (const plan of SELLER_PLANS) {
      const tier = tiers.find((t) => t.id === plan.id);
      expect(tier, `tier for ${plan.id}`).toBeDefined();
      expect(tier?.name).toBe(plan.name);
      expect(tier?.fixedFee).toBe(plan.priceMonthly / 100);
      expect(tier?.commissionAtPrice).toBe(price * (plan.commissionRate ?? 0));
      expect(tier?.total).toBe(
        plan.priceMonthly / 100 + price * (plan.commissionRate ?? 0),
      );
    }
  });

  it("flags the genuinely cheapest tier at the given price", () => {
    const price = 300000;
    const { tiers, cheapestId } = buildTrueDeedComparison(price, PLAN_SUMMARIES);
    const minTotal = Math.min(...tiers.map((t) => t.total));
    expect(tiers.find((t) => t.id === cheapestId)?.total).toBe(minTotal);
  });

  it("rejects non-positive prices", () => {
    expect(() => buildTrueDeedComparison(-1, PLAN_SUMMARIES)).toThrow(RangeError);
  });

  it("rejects an empty plans array", () => {
    expect(() => buildTrueDeedComparison(300000, [])).toThrow(RangeError);
  });
});
