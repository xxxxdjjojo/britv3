import { describe, expect, it } from "vitest";

import { canPurchaseBoost, isPlacementLive } from "./eligibility";

describe("canPurchaseBoost", () => {
  it("allows a verified trader with an active subscription", () => {
    const result = canPurchaseBoost({ verificationStatus: "verified", subscriptionStatus: "active" });
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("allows a verified trader on a trial", () => {
    expect(canPurchaseBoost({ verificationStatus: "verified", subscriptionStatus: "trialing" }).eligible).toBe(true);
  });

  it("blocks an unverified trader and explains why", () => {
    const result = canPurchaseBoost({ verificationStatus: "unverified", subscriptionStatus: "active" });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("verification");
  });

  it("blocks a suspended trader", () => {
    const result = canPurchaseBoost({ verificationStatus: "suspended", subscriptionStatus: "active" });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("verification");
  });

  it("blocks a verified trader without an active subscription", () => {
    const result = canPurchaseBoost({ verificationStatus: "verified", subscriptionStatus: "canceled" });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("subscription");
  });
});

describe("isPlacementLive", () => {
  const now = new Date("2026-06-30T12:00:00Z");

  it("is live when active and within its date window", () => {
    expect(
      isPlacementLive({ status: "active", startsAt: "2026-06-01T00:00:00Z", endsAt: "2026-07-30T00:00:00Z" }, now),
    ).toBe(true);
  });

  it("is live when active with no end date", () => {
    expect(isPlacementLive({ status: "active", startsAt: "2026-06-01T00:00:00Z", endsAt: null }, now)).toBe(true);
  });

  it("is not live when paused", () => {
    expect(
      isPlacementLive({ status: "paused", startsAt: "2026-06-01T00:00:00Z", endsAt: null }, now),
    ).toBe(false);
  });

  it("is not live when expired", () => {
    expect(
      isPlacementLive({ status: "active", startsAt: "2026-06-01T00:00:00Z", endsAt: "2026-06-15T00:00:00Z" }, now),
    ).toBe(false);
  });

  it("is not live before it starts", () => {
    expect(
      isPlacementLive({ status: "active", startsAt: "2026-07-01T00:00:00Z", endsAt: null }, now),
    ).toBe(false);
  });
});
