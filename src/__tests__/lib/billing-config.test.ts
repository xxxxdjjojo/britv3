// src/__tests__/lib/billing-config.test.ts
//
// MEMO PIVOT v2 — 7-segment pricing schema.
// Canonical plan IDs and prices are defined here as test assertions; the
// implementation in src/lib/billing-config.ts must satisfy every assertion.
//
// "server-only" is aliased to a no-op stub in vitest.config.mts so this
// server module can be imported directly without the Next.js runtime.

import { describe, it, expect } from "vitest";

import {
  SELLER_PLANS,
  AGENT_PLANS,
  LANDLORD_PLANS,
  PROVIDER_PLANS,
  PROVIDER_NICHE_PLANS,
  DEVELOPER_PLANS,
  TRADER_PLANS,
  PLANS_BY_SEGMENT,
  ALL_PLANS,
  BOOST_PRICES,
  ALLOWED_PRICE_IDS,
  isPriceIdAllowed,
  getPlanByPriceId,
  getPlansBySegment,
  resolveInternalPlanId,
} from "@/lib/billing-config";

// ----------------------------------------------------------------------------
// Sellers (NEW — one-off pricing)
// ----------------------------------------------------------------------------
describe("SELLER_PLANS (new, one-off)", () => {
  it("has 4 tiers: Basic, Plus, Premium, No-Sale-No-Fee", () => {
    expect(SELLER_PLANS).toHaveLength(4);
    expect(SELLER_PLANS.map((p) => p.id)).toEqual([
      "seller_basic",
      "seller_plus",
      "seller_premium",
      "seller_nsnf",
    ]);
  });

  it("Basic is £99 one-off (9900 pence) with 0.50% completion fee", () => {
    const basic = SELLER_PLANS[0];
    expect(basic.priceMonthly).toBe(9900);
    expect(basic.priceAnnual).toBe(0);
    expect(basic.pricingType).toBe("one_off");
    expect(basic.commissionRate).toBe(0.005);
  });

  it("Plus is £249 (24900 pence) one-off with 0.35% commission, highlighted", () => {
    const plus = SELLER_PLANS[1];
    expect(plus.priceMonthly).toBe(24900);
    expect(plus.commissionRate).toBe(0.0035);
    expect(plus.highlighted).toBe(true);
  });

  it("Premium is £449 (44900 pence) one-off with 0.25% commission", () => {
    const premium = SELLER_PLANS[2];
    expect(premium.priceMonthly).toBe(44900);
    expect(premium.commissionRate).toBe(0.0025);
  });

  it("No-Sale-No-Fee is £0 upfront with 1.00% completion fee", () => {
    const nsnf = SELLER_PLANS[3];
    expect(nsnf.priceMonthly).toBe(0);
    expect(nsnf.commissionRate).toBe(0.01);
  });
});

// ----------------------------------------------------------------------------
// Agents (REPLACED — Listed / Pro / Elite, with revenue-share model)
// ----------------------------------------------------------------------------
describe("AGENT_PLANS (replaced)", () => {
  it("has 3 tiers: Listed, Pro, Elite", () => {
    expect(AGENT_PLANS).toHaveLength(3);
    expect(AGENT_PLANS.map((p) => p.id)).toEqual([
      "agent_listed",
      "agent_pro",
      "agent_elite",
    ]);
  });

  it("Listed is £0/month (free with rev-share on Britestate-originated leads)", () => {
    expect(AGENT_PLANS[0].priceMonthly).toBe(0);
    expect(AGENT_PLANS[0].priceAnnual).toBe(0);
  });

  it("Pro is £99/month (9900 pence), 70/30 split, highlighted", () => {
    const pro = AGENT_PLANS[1];
    expect(pro.priceMonthly).toBe(9900);
    expect(pro.priceAnnual).toBe(95000); // 2 months free
    expect(pro.highlighted).toBe(true);
  });

  it("Elite is £349/month (34900 pence), 85/15 split", () => {
    expect(AGENT_PLANS[2].priceMonthly).toBe(34900);
    expect(AGENT_PLANS[2].priceAnnual).toBe(335000);
  });

  it("OLD plan ids removed (agent_performance, agent_professional, agent_enterprise)", () => {
    const ids = AGENT_PLANS.map((p) => p.id);
    expect(ids).not.toContain("agent_performance");
    expect(ids).not.toContain("agent_professional");
    expect(ids).not.toContain("agent_enterprise");
  });
});

// ----------------------------------------------------------------------------
// Landlords (REPLACED — Free / Essential / Pro / Portfolio)
// ----------------------------------------------------------------------------
describe("LANDLORD_PLANS (replaced, 4-tier)", () => {
  it("has 4 tiers", () => {
    expect(LANDLORD_PLANS).toHaveLength(4);
    expect(LANDLORD_PLANS.map((p) => p.id)).toEqual([
      "landlord_free",
      "landlord_essential",
      "landlord_pro",
      "landlord_portfolio",
    ]);
  });

  it("Free £0, Essential £15, Pro £39, Portfolio £99", () => {
    expect(LANDLORD_PLANS[0].priceMonthly).toBe(0);
    expect(LANDLORD_PLANS[1].priceMonthly).toBe(1500);
    expect(LANDLORD_PLANS[2].priceMonthly).toBe(3900);
    expect(LANDLORD_PLANS[3].priceMonthly).toBe(9900);
  });

  it("annual = 2 months free", () => {
    expect(LANDLORD_PLANS[1].priceAnnual).toBe(14400); // £144
    expect(LANDLORD_PLANS[2].priceAnnual).toBe(37400); // £374
    expect(LANDLORD_PLANS[3].priceAnnual).toBe(95000); // £950
  });

  it("Pro is highlighted as most popular", () => {
    expect(LANDLORD_PLANS[2].highlighted).toBe(true);
  });
});

// ----------------------------------------------------------------------------
// Providers (REPLACED — Listed / Pro / Elite, tier-banded commission)
// ----------------------------------------------------------------------------
describe("PROVIDER_PLANS (replaced, tier-banded commission)", () => {
  it("has 3 tiers: Listed, Pro, Elite", () => {
    expect(PROVIDER_PLANS).toHaveLength(3);
    expect(PROVIDER_PLANS.map((p) => p.id)).toEqual([
      "provider_listed",
      "provider_pro",
      "provider_elite",
    ]);
  });

  it("Listed is free with 12% commission per job", () => {
    expect(PROVIDER_PLANS[0].priceMonthly).toBe(0);
    expect(PROVIDER_PLANS[0].commissionRate).toBe(0.12);
  });

  it("Pro is £39/month with 10% commission, highlighted", () => {
    expect(PROVIDER_PLANS[1].priceMonthly).toBe(3900);
    expect(PROVIDER_PLANS[1].priceAnnual).toBe(37400);
    expect(PROVIDER_PLANS[1].commissionRate).toBe(0.10);
    expect(PROVIDER_PLANS[1].highlighted).toBe(true);
  });

  it("Elite is £149/month with 6% commission", () => {
    expect(PROVIDER_PLANS[2].priceMonthly).toBe(14900);
    expect(PROVIDER_PLANS[2].priceAnnual).toBe(143000);
    expect(PROVIDER_PLANS[2].commissionRate).toBe(0.06);
  });

  it("OLD provider plan ids removed", () => {
    const ids = PROVIDER_PLANS.map((p) => p.id);
    expect(ids).not.toContain("provider_member");
    expect(ids).not.toContain("provider_professional");
  });
});

// ----------------------------------------------------------------------------
// Providers Niche (NEW — Conveyancer / Surveyor / Mortgage broker)
// ----------------------------------------------------------------------------
describe("PROVIDER_NICHE_PLANS (new)", () => {
  it("has 3 tiers", () => {
    expect(PROVIDER_NICHE_PLANS).toHaveLength(3);
    expect(PROVIDER_NICHE_PLANS.map((p) => p.id)).toEqual([
      "provider_conveyancer",
      "provider_surveyor",
      "provider_mortgage_broker",
    ]);
  });

  it("Conveyancer £79/month with 6% commission", () => {
    expect(PROVIDER_NICHE_PLANS[0].priceMonthly).toBe(7900);
    expect(PROVIDER_NICHE_PLANS[0].commissionRate).toBe(0.06);
  });

  it("Surveyor £79/month with 6% commission", () => {
    expect(PROVIDER_NICHE_PLANS[1].priceMonthly).toBe(7900);
    expect(PROVIDER_NICHE_PLANS[1].commissionRate).toBe(0.06);
  });

  it("Mortgage broker £49/month, £35 per qualified lead (flat)", () => {
    expect(PROVIDER_NICHE_PLANS[2].priceMonthly).toBe(4900);
    expect(PROVIDER_NICHE_PLANS[2].perLeadFee).toBe(3500); // £35
  });
});

// ----------------------------------------------------------------------------
// Developers (NEW — Single / Multi / Enterprise)
// ----------------------------------------------------------------------------
describe("DEVELOPER_PLANS (new)", () => {
  it("has 3 tiers: Single, Multi, Enterprise", () => {
    expect(DEVELOPER_PLANS).toHaveLength(3);
    expect(DEVELOPER_PLANS.map((p) => p.id)).toEqual([
      "developer_single",
      "developer_multi",
      "developer_enterprise",
    ]);
  });

  it("Single £299/month, 0.25% completion fee", () => {
    expect(DEVELOPER_PLANS[0].priceMonthly).toBe(29900);
    expect(DEVELOPER_PLANS[0].commissionRate).toBe(0.0025);
  });

  it("Multi £799/month, 0.20% completion fee, highlighted", () => {
    expect(DEVELOPER_PLANS[1].priceMonthly).toBe(79900);
    expect(DEVELOPER_PLANS[1].commissionRate).toBe(0.0020);
    expect(DEVELOPER_PLANS[1].highlighted).toBe(true);
  });

  it("Enterprise £1,999/month, 0.15% completion fee", () => {
    expect(DEVELOPER_PLANS[2].priceMonthly).toBe(199900);
    expect(DEVELOPER_PLANS[2].commissionRate).toBe(0.0015);
  });
});

// ----------------------------------------------------------------------------
// Traders (NEW — Pro / Elite)
// ----------------------------------------------------------------------------
describe("TRADER_PLANS (new)", () => {
  it("has 2 tiers: Pro, Elite", () => {
    expect(TRADER_PLANS).toHaveLength(2);
    expect(TRADER_PLANS.map((p) => p.id)).toEqual(["trader_pro", "trader_elite"]);
  });

  it("Pro £99/month, 0.50% resale fee", () => {
    expect(TRADER_PLANS[0].priceMonthly).toBe(9900);
    expect(TRADER_PLANS[0].commissionRate).toBe(0.005);
  });

  it("Elite £299/month, 0.50% resale fee", () => {
    expect(TRADER_PLANS[1].priceMonthly).toBe(29900);
    expect(TRADER_PLANS[1].commissionRate).toBe(0.005);
  });
});

// ----------------------------------------------------------------------------
// Boosts (EXTENDED — AI Valuation, Story, Digest)
// ----------------------------------------------------------------------------
describe("BOOST_PRICES (extended)", () => {
  it("contains the 3 listing boosts (7d, 14d, 30d)", () => {
    expect(BOOST_PRICES["7d"].price).toBe(1500);
    expect(BOOST_PRICES["14d"].price).toBe(2500);
    expect(BOOST_PRICES["30d"].price).toBe(4500);
  });

  it("contains 3 new AI boosts", () => {
    expect(BOOST_PRICES.ai_valuation.price).toBe(2900);
    expect(BOOST_PRICES.story.price).toBe(7900);
    expect(BOOST_PRICES.digest.price).toBe(3900);
  });
});

// ----------------------------------------------------------------------------
// PLANS_BY_SEGMENT / ALL_PLANS / getPlansBySegment
// ----------------------------------------------------------------------------
describe("PLANS_BY_SEGMENT", () => {
  it("exposes all 7 segments", () => {
    expect(Object.keys(PLANS_BY_SEGMENT).sort()).toEqual([
      "agent",
      "developer",
      "landlord",
      "provider",
      "provider_niche",
      "seller",
      "trader",
    ]);
  });

  it("getPlansBySegment returns the segment plans", () => {
    expect(getPlansBySegment("seller")).toBe(SELLER_PLANS);
    expect(getPlansBySegment("agent")).toBe(AGENT_PLANS);
    expect(getPlansBySegment("landlord")).toBe(LANDLORD_PLANS);
    expect(getPlansBySegment("provider")).toBe(PROVIDER_PLANS);
    expect(getPlansBySegment("provider_niche")).toBe(PROVIDER_NICHE_PLANS);
    expect(getPlansBySegment("developer")).toBe(DEVELOPER_PLANS);
    expect(getPlansBySegment("trader")).toBe(TRADER_PLANS);
  });

  it("ALL_PLANS concatenates every segment", () => {
    const total =
      SELLER_PLANS.length +
      AGENT_PLANS.length +
      LANDLORD_PLANS.length +
      PROVIDER_PLANS.length +
      PROVIDER_NICHE_PLANS.length +
      DEVELOPER_PLANS.length +
      TRADER_PLANS.length;
    expect(ALL_PLANS).toHaveLength(total);
  });
});

// ----------------------------------------------------------------------------
// Allowlist
// ----------------------------------------------------------------------------
describe("ALLOWED_PRICE_IDS", () => {
  it("includes every new plan's monthly price id", () => {
    for (const plan of ALL_PLANS) {
      expect(isPriceIdAllowed(plan.priceIdMonthly)).toBe(true);
    }
  });

  it("includes every new plan's annual price id when defined", () => {
    for (const plan of ALL_PLANS) {
      if (plan.priceIdAnnual && plan.priceIdAnnual.length > 0) {
        expect(isPriceIdAllowed(plan.priceIdAnnual)).toBe(true);
      }
    }
  });

  it("includes every boost price id", () => {
    for (const boost of Object.values(BOOST_PRICES)) {
      expect(isPriceIdAllowed(boost.priceId)).toBe(true);
    }
  });

  it("size is at least 30 (3 listing boosts + 3 ai boosts + 25 plan prices)", () => {
    expect(ALLOWED_PRICE_IDS.size).toBeGreaterThanOrEqual(30);
  });
});

// ----------------------------------------------------------------------------
// resolveInternalPlanId
// ----------------------------------------------------------------------------
describe("resolveInternalPlanId", () => {
  it("resolves a known plan's monthly price id", () => {
    const elite = PROVIDER_PLANS[2];
    expect(resolveInternalPlanId(elite.priceIdMonthly)).toBe("provider_elite");
  });

  it("resolves a known plan's annual price id", () => {
    const pro = AGENT_PLANS[1];
    expect(resolveInternalPlanId(pro.priceIdAnnual)).toBe("agent_pro");
  });

  it("returns fallback for unknown price ID", () => {
    expect(resolveInternalPlanId("price_unknown_xyz", "SomePlanNickname")).toBe(
      "SomePlanNickname",
    );
  });

  it("returns fallback for null/undefined price ID", () => {
    expect(resolveInternalPlanId(null, "FallbackName")).toBe("FallbackName");
    expect(resolveInternalPlanId(undefined)).toBeNull();
  });
});

// ----------------------------------------------------------------------------
// getPlanByPriceId
// ----------------------------------------------------------------------------
describe("getPlanByPriceId", () => {
  it("finds a plan by its monthly price id", () => {
    const pro = AGENT_PLANS[1];
    expect(getPlanByPriceId(pro.priceIdMonthly)?.id).toBe("agent_pro");
  });

  it("finds a plan by its annual price id", () => {
    const elite = PROVIDER_PLANS[2];
    expect(getPlanByPriceId(elite.priceIdAnnual)?.id).toBe("provider_elite");
  });

  it("returns undefined for unknown id", () => {
    expect(getPlanByPriceId("price_xxxx_unknown")).toBeUndefined();
  });
});
