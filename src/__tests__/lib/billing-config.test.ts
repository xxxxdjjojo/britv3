// src/__tests__/lib/billing-config.test.ts
// "server-only" is aliased to a no-op stub in vitest.config.mts so this
// server module can be imported directly without the Next.js runtime.
import { describe, it, expect } from "vitest";

import {
  PROVIDER_PLANS,
  AGENT_PLANS,
  LANDLORD_PLANS,
  PLANS_BY_ROLE,
  isPriceIdAllowed,
  getPlanByPriceId,
  resolveInternalPlanId,
} from "@/lib/billing-config";

describe("PROVIDER_PLANS", () => {
  it("has 3 tiers: Member, Professional, Elite", () => {
    expect(PROVIDER_PLANS).toHaveLength(3);
    expect(PROVIDER_PLANS.map((p) => p.name)).toEqual([
      "Member",
      "Professional",
      "Elite",
    ]);
  });

  it("Member is £47/month (4700 pence)", () => {
    const member = PROVIDER_PLANS[0];
    expect(member.priceMonthly).toBe(4700);
  });

  it("Professional is £97/month (9700 pence), highlighted", () => {
    const pro = PROVIDER_PLANS[1];
    expect(pro.priceMonthly).toBe(9700);
    expect(pro.highlighted).toBe(true);
  });

  it("Elite is £197/month (19700 pence)", () => {
    const elite = PROVIDER_PLANS[2];
    expect(elite.priceMonthly).toBe(19700);
  });

  it("annual pricing saves 2 months (Member: £470/yr)", () => {
    const member = PROVIDER_PLANS[0];
    expect(member.priceAnnual).toBe(47000);
  });

  it("annual pricing saves 2 months (Professional: £970/yr)", () => {
    const pro = PROVIDER_PLANS[1];
    expect(pro.priceAnnual).toBe(97000);
  });

  it("annual pricing saves 2 months (Elite: £1970/yr)", () => {
    const elite = PROVIDER_PLANS[2];
    expect(elite.priceAnnual).toBe(197000);
  });
});

describe("AGENT_PLANS", () => {
  it("has 3 tiers: Performance, Professional, Enterprise", () => {
    expect(AGENT_PLANS).toHaveLength(3);
    expect(AGENT_PLANS.map((p) => p.name)).toEqual([
      "Performance",
      "Professional",
      "Enterprise",
    ]);
  });

  it("Performance is £0/month (free tier with commission split)", () => {
    const perf = AGENT_PLANS[0];
    expect(perf.priceMonthly).toBe(0);
    expect(perf.priceAnnual).toBe(0);
  });

  it("Professional is £297/month", () => {
    const pro = AGENT_PLANS[1];
    expect(pro.priceMonthly).toBe(29700);
    expect(pro.highlighted).toBe(true);
  });

  it("Enterprise is £497/month", () => {
    const ent = AGENT_PLANS[2];
    expect(ent.priceMonthly).toBe(49700);
  });

  it("Professional annual is £2,850/yr", () => {
    expect(AGENT_PLANS[1].priceAnnual).toBe(285000);
  });

  it("Enterprise annual is £4,770/yr", () => {
    expect(AGENT_PLANS[2].priceAnnual).toBe(477000);
  });
});

describe("LANDLORD_PLANS (unchanged)", () => {
  it("has 2 tiers: Essential £19, Professional £49", () => {
    expect(LANDLORD_PLANS).toHaveLength(2);
    expect(LANDLORD_PLANS[0].priceMonthly).toBe(1900);
    expect(LANDLORD_PLANS[1].priceMonthly).toBe(4900);
  });
});

describe("PLANS_BY_ROLE", () => {
  it("maps agent, landlord, provider to their plans", () => {
    expect(PLANS_BY_ROLE.provider).toBe(PROVIDER_PLANS);
    expect(PLANS_BY_ROLE.agent).toBe(AGENT_PLANS);
    expect(PLANS_BY_ROLE.landlord).toBe(LANDLORD_PLANS);
  });
});

describe("resolveInternalPlanId", () => {
  it("resolves a known monthly price ID to internal plan ID", () => {
    expect(resolveInternalPlanId("price_provider_member_test")).toBe("provider_member");
  });

  it("resolves a known annual price ID to internal plan ID", () => {
    expect(resolveInternalPlanId("price_agent_pro_annual_test")).toBe("agent_professional");
  });

  it("resolves $0 agent plan price ID correctly", () => {
    // [ENG REVIEW 9A] — critical: free plan must resolve to agent_performance
    expect(resolveInternalPlanId("price_agent_perf_test")).toBe("agent_performance");
  });

  it("returns fallback for unknown price ID", () => {
    expect(resolveInternalPlanId("price_unknown_xyz", "SomePlanNickname")).toBe("SomePlanNickname");
  });

  it("returns fallback for null/undefined price ID", () => {
    expect(resolveInternalPlanId(null, "FallbackName")).toBe("FallbackName");
    expect(resolveInternalPlanId(undefined)).toBeNull();
  });
});
