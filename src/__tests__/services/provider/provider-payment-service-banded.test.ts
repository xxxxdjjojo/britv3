// src/__tests__/services/provider/provider-payment-service-banded.test.ts
//
// MEMO PIVOT v2 — provider-payment-service must compute marketplace fees
// using the tier-banded COMMISSION_RATES_BY_PLAN instead of the flat 2.5%.

import { describe, it, expect } from "vitest";

import { calculatePlatformFee } from "@/services/provider/provider-payment-service";

describe("calculatePlatformFee (banded by plan)", () => {
  it("provider_listed pays 12% on a £1,000 job", () => {
    const fee = calculatePlatformFee({
      grossAmountPence: 100_000,
      providerPlanId: "provider_listed",
    });
    expect(fee).toBe(12_000); // £120
  });

  it("provider_pro pays 10% on a £1,000 job", () => {
    const fee = calculatePlatformFee({
      grossAmountPence: 100_000,
      providerPlanId: "provider_pro",
    });
    expect(fee).toBe(10_000); // £100
  });

  it("provider_elite pays 6% on a £1,000 job", () => {
    const fee = calculatePlatformFee({
      grossAmountPence: 100_000,
      providerPlanId: "provider_elite",
    });
    expect(fee).toBe(6_000); // £60
  });

  it("conveyancer / surveyor pays 6%", () => {
    expect(
      calculatePlatformFee({
        grossAmountPence: 100_000,
        providerPlanId: "provider_conveyancer",
      }),
    ).toBe(6_000);
  });

  it("unknown / null planId falls back to the default 12% (conservative)", () => {
    expect(
      calculatePlatformFee({ grossAmountPence: 100_000, providerPlanId: null }),
    ).toBe(12_000);
  });

  it("rounds fractional pence to the nearest integer", () => {
    expect(
      calculatePlatformFee({
        grossAmountPence: 33_337,
        providerPlanId: "provider_pro",
      }),
    ).toBe(Math.round(33_337 * 0.10));
  });

  it("never returns more than the gross amount", () => {
    const fee = calculatePlatformFee({
      grossAmountPence: 100,
      providerPlanId: "provider_listed",
    });
    expect(fee).toBeLessThanOrEqual(100);
  });
});
