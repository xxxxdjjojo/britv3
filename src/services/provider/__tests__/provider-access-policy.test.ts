import { describe, expect, it } from "vitest";
import {
  evaluateProviderAccess,
  providerRequirementForPath,
  type ProviderAccessState,
} from "../provider-access-policy";

const COMPLETE: ProviderAccessState = {
  role: "service_provider",
  emailConfirmed: true,
  adminVerified: true,
  peerVouchCount: 3,
  clientVouchCount: 3,
  grandfathered: false,
  vouchComplete: true,
  subscriptionActive: true,
  stripeConnectReady: true,
};

describe("provider access policy", () => {
  it("classifies setup routes as progress and former open sections as business", () => {
    expect(providerRequirementForPath("/dashboard/provider")).toBe("progress");
    expect(providerRequirementForPath("/dashboard/provider/verification/peer-references")).toBe("progress");
    expect(providerRequirementForPath("/dashboard/provider/referrals")).toBe("progress");
    expect(providerRequirementForPath("/dashboard/provider/billing")).toBe("progress");
    expect(providerRequirementForPath("/dashboard/provider/jobs/leads")).toBe("business");
    expect(providerRequirementForPath("/dashboard/provider/quotes")).toBe("business");
    expect(providerRequirementForPath("/dashboard/provider/reviews")).toBe("business");
    expect(providerRequirementForPath("/dashboard/provider/payments")).toBe("business");
    expect(providerRequirementForPath("/dashboard/provider/boost")).toBe("business");
  });

  it("the emergency bypass skips only the vouch requirement", () => {
    expect(
      evaluateProviderAccess(
        { ...COMPLETE, vouchComplete: false },
        "business",
        { vouchGateBypass: true },
      ),
    ).toEqual({ allowed: true });

    for (const state of [
      { ...COMPLETE, emailConfirmed: false },
      { ...COMPLETE, adminVerified: false },
      { ...COMPLETE, subscriptionActive: false },
    ]) {
      expect(
        evaluateProviderAccess(state, "business", {
          vouchGateBypass: true,
        }).allowed,
      ).toBe(false);
    }
  });

  it("requires Stripe Connect only for transactions", () => {
    const state = { ...COMPLETE, stripeConnectReady: false };
    expect(evaluateProviderAccess(state, "business")).toEqual({ allowed: true });
    expect(evaluateProviderAccess(state, "transaction")).toEqual({
      allowed: false,
      reason: "stripe_connect_incomplete",
    });
  });
});
