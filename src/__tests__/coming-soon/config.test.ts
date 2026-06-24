import { describe, expect, it } from "vitest";
import {
  REFERRAL_BOOST,
  REWARD_TIERS,
} from "@/lib/coming-soon/config";

describe("coming-soon config", () => {
  it("defines exactly three reward tiers", () => {
    expect(REWARD_TIERS).toHaveLength(3);
  });

  it("orders reward tiers by ascending referral thresholds (3, 10, 25)", () => {
    expect(REWARD_TIERS.map((tier) => tier.referrals)).toEqual([3, 10, 25]);
  });

  it("gives every reward tier a non-empty label", () => {
    for (const tier of REWARD_TIERS) {
      expect(tier.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("applies a positive referral boost", () => {
    expect(REFERRAL_BOOST).toBeGreaterThan(0);
  });
});
