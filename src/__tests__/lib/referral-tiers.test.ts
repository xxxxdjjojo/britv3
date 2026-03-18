import { describe, it, expect } from "vitest";
import {
  getTierForCount,
  getTierConfig,
  getNextTier,
  TIER_CONFIGS,
} from "@/lib/referral-tiers";

describe("getTierForCount", () => {
  it("returns 'none' for 0 referrals", () => {
    expect(getTierForCount(0)).toBe("none");
  });

  it("returns 'connector' for 1 referral", () => {
    expect(getTierForCount(1)).toBe("connector");
  });

  it("returns 'connector' for 2 referrals", () => {
    expect(getTierForCount(2)).toBe("connector");
  });

  it("returns 'ambassador' for 3 referrals", () => {
    expect(getTierForCount(3)).toBe("ambassador");
  });

  it("returns 'ambassador' for 4 referrals", () => {
    expect(getTierForCount(4)).toBe("ambassador");
  });

  it("returns 'champion' for 5 referrals", () => {
    expect(getTierForCount(5)).toBe("champion");
  });

  it("returns 'champion' for 9 referrals", () => {
    expect(getTierForCount(9)).toBe("champion");
  });

  it("returns 'partner' for 10 referrals", () => {
    expect(getTierForCount(10)).toBe("partner");
  });

  it("returns 'partner' for 50 referrals", () => {
    expect(getTierForCount(50)).toBe("partner");
  });
});

describe("getTierConfig", () => {
  it("connector has 1 month free reward", () => {
    const config = getTierConfig("connector");
    expect(config.freeMonths).toBe(1);
    expect(config.badge).toBe("bronze");
  });

  it("ambassador has 2 months free and priority leads", () => {
    const config = getTierConfig("ambassador");
    expect(config.freeMonths).toBe(2);
    expect(config.badge).toBe("silver");
    expect(config.priorityLeadDays).toBe(7);
  });

  it("champion has 3 months free and founding referrer status", () => {
    const config = getTierConfig("champion");
    expect(config.freeMonths).toBe(3);
    expect(config.badge).toBe("gold");
    expect(config.priorityLeadDays).toBe(14);
    expect(config.foundingReferrer).toBe(true);
  });

  it("partner has 5 months free and 21 priority lead days", () => {
    const config = getTierConfig("partner");
    expect(config.freeMonths).toBe(5);
    expect(config.badge).toBe("platinum");
    expect(config.priorityLeadDays).toBe(21);
  });
});

describe("getNextTier", () => {
  it("returns connector info for none tier", () => {
    const next = getNextTier("none");
    expect(next?.tier).toBe("connector");
    expect(next?.threshold).toBe(1);
  });

  it("returns ambassador info for connector tier", () => {
    const next = getNextTier("connector");
    expect(next?.tier).toBe("ambassador");
    expect(next?.threshold).toBe(3);
  });

  it("returns null for partner tier (max)", () => {
    expect(getNextTier("partner")).toBeNull();
  });
});

describe("TIER_CONFIGS", () => {
  it("has configs for all tiers except none", () => {
    expect(Object.keys(TIER_CONFIGS)).toEqual([
      "connector",
      "ambassador",
      "champion",
      "partner",
    ]);
  });
});
