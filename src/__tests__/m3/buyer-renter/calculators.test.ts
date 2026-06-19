/**
 * M3-A8 — Buyer/Renter discovery & tools: pure calculator logic.
 *
 * These are the highest-value deterministic units in the area: pure functions
 * with no Supabase/network/DOM dependency. Covers band boundaries, buyer types,
 * surcharges, zero/edge inputs, and amortization correctness.
 *
 * Values were verified by executing the actual implementations before asserting.
 */

import { describe, it, expect } from "vitest";

import {
  calculateMonthlyPayment,
  calculateTotalRepayable,
  calculateAffordability,
} from "@/lib/calculators/mortgage";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import { calculateLbtt } from "@/lib/calculators/lbtt";
import { calculateLtt } from "@/lib/calculators/ltt";
import {
  SDLT_STANDARD,
  SDLT_FTB_PRICE_CAP,
} from "@/lib/calculators/sdlt-rates";

// ---------------------------------------------------------------------------
// Mortgage — amortization
// ---------------------------------------------------------------------------

describe("calculateMonthlyPayment", () => {
  it("computes the standard amortization payment (200k @ 5% / 25yr)", () => {
    expect(calculateMonthlyPayment(200_000, 5, 25)).toBeCloseTo(1169.18, 2);
  });

  it("handles a zero interest rate via simple division (P / n)", () => {
    // 100_000 / (25 * 12) = 333.33...
    expect(calculateMonthlyPayment(100_000, 0, 25)).toBeCloseTo(333.33, 2);
  });

  it("returns 0 for non-positive principal", () => {
    expect(calculateMonthlyPayment(0, 5, 25)).toBe(0);
    expect(calculateMonthlyPayment(-50_000, 5, 25)).toBe(0);
  });

  it("returns 0 for non-positive term", () => {
    expect(calculateMonthlyPayment(200_000, 5, 0)).toBe(0);
    expect(calculateMonthlyPayment(200_000, 5, -10)).toBe(0);
  });

  it("a higher rate always yields a higher monthly payment", () => {
    const low = calculateMonthlyPayment(250_000, 3, 30);
    const high = calculateMonthlyPayment(250_000, 6, 30);
    expect(high).toBeGreaterThan(low);
  });

  it("a longer term lowers the monthly payment for the same loan", () => {
    const short = calculateMonthlyPayment(250_000, 5, 15);
    const long = calculateMonthlyPayment(250_000, 5, 35);
    expect(long).toBeLessThan(short);
  });

  it("rounds to 2 decimal places", () => {
    const payment = calculateMonthlyPayment(123_456, 4.37, 27);
    expect(Number.isInteger(payment * 100)).toBe(true);
  });
});

describe("calculateTotalRepayable", () => {
  it("computes total repayable and total interest (200k @ 5% / 25yr)", () => {
    const result = calculateTotalRepayable(200_000, 5, 25);
    expect(result.totalRepayable).toBeCloseTo(350_754, 0);
    expect(result.totalInterest).toBeCloseTo(150_754, 0);
  });

  it("interest is zero when the rate is zero", () => {
    const result = calculateTotalRepayable(120_000, 0, 25);
    // 120_000 fully repaid, no interest (rounding tolerance for the /n split)
    expect(result.totalInterest).toBeCloseTo(0, 0);
  });

  it("totalInterest equals totalRepayable minus principal", () => {
    const principal = 275_000;
    const result = calculateTotalRepayable(principal, 4.5, 30);
    expect(result.totalInterest).toBeCloseTo(
      result.totalRepayable - principal,
      2,
    );
  });
});

describe("calculateAffordability", () => {
  it("subtracts the deposit from the price to derive the principal", () => {
    const result = calculateAffordability(300_000, 60_000, 4.5, 30);
    // principal = 240_000
    expect(result.monthlyPayment).toBeCloseTo(1216.04, 2);
    expect(result.totalRepayable).toBeCloseTo(437_774.4, 1);
    expect(result.totalInterest).toBeCloseTo(197_774.4, 1);
  });

  it("clamps a deposit larger than the price to a zero principal", () => {
    const result = calculateAffordability(200_000, 250_000, 5, 25);
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it("a 100% deposit produces no mortgage", () => {
    const result = calculateAffordability(200_000, 200_000, 5, 25);
    expect(result.monthlyPayment).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SDLT — England & NI bands (April 2025)
// ---------------------------------------------------------------------------

describe("calculateSdlt — standard buyer", () => {
  it("is zero at and below the nil-rate threshold (125k)", () => {
    expect(calculateSdlt(125_000, "standard").totalTax).toBe(0);
    expect(calculateSdlt(100_000, "standard").totalTax).toBe(0);
  });

  it("charges 2% on the slice between 125k and 250k", () => {
    // (250_000 - 125_000) * 0.02 = 2500
    expect(calculateSdlt(250_000, "standard").totalTax).toBe(2_500);
  });

  it("adds 5% on the slice above 250k (300k → 5000)", () => {
    // 2500 + (300_000 - 250_000) * 0.05 = 5000
    expect(calculateSdlt(300_000, "standard").totalTax).toBe(5_000);
  });

  it("computes the 5% band up to 925k (600k → 20000)", () => {
    expect(calculateSdlt(600_000, "standard").totalTax).toBe(20_000);
  });

  it("computes the 10% band (1,000,000 → 43750)", () => {
    expect(calculateSdlt(1_000_000, "standard").totalTax).toBe(43_750);
  });

  it("computes the top 12% band (2,000,000 → 153750)", () => {
    expect(calculateSdlt(2_000_000, "standard").totalTax).toBe(153_750);
  });

  it("returns an empty breakdown and zero tax for non-positive price", () => {
    const result = calculateSdlt(0, "standard");
    expect(result.totalTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.bands).toEqual([]);
  });

  it("effectiveRate equals totalTax / price", () => {
    const result = calculateSdlt(300_000, "standard");
    expect(result.effectiveRate).toBeCloseTo(5_000 / 300_000, 6);
  });
});

describe("calculateSdlt — first-time buyer relief", () => {
  it("is zero at and below the FTB nil-rate threshold (300k)", () => {
    expect(calculateSdlt(300_000, "first_time").totalTax).toBe(0);
    expect(calculateSdlt(250_000, "first_time").totalTax).toBe(0);
  });

  it("charges 5% on the slice between 300k and 500k (500k → 10000)", () => {
    expect(calculateSdlt(500_000, "first_time").totalTax).toBe(10_000);
  });

  it("falls back to standard rates above the FTB price cap (600k)", () => {
    const ftb = calculateSdlt(600_000, "first_time").totalTax;
    const standard = calculateSdlt(600_000, "standard").totalTax;
    expect(ftb).toBe(standard);
    expect(ftb).toBe(20_000);
  });

  it("the FTB price cap constant is 500k", () => {
    expect(SDLT_FTB_PRICE_CAP).toBe(500_000);
  });
});

describe("calculateSdlt — additional property surcharge", () => {
  it("applies a +5% surcharge across all bands (250k → 15000)", () => {
    // standard 250k = 2500; additional adds 5% on the whole 250k = 12500 → 15000
    expect(calculateSdlt(250_000, "additional").totalTax).toBe(15_000);
  });

  it("an additional purchase always costs more than a standard one", () => {
    const additional = calculateSdlt(400_000, "additional").totalTax;
    const standard = calculateSdlt(400_000, "standard").totalTax;
    expect(additional).toBeGreaterThan(standard);
  });
});

describe("SDLT_STANDARD band config", () => {
  it("starts at the 125k nil-rate band and tops out at 12%", () => {
    expect(SDLT_STANDARD[0]).toEqual({ threshold: 125_000, rate: 0 });
    expect(SDLT_STANDARD[SDLT_STANDARD.length - 1].rate).toBe(0.12);
  });
});

// ---------------------------------------------------------------------------
// LBTT — Scotland
// ---------------------------------------------------------------------------

describe("calculateLbtt", () => {
  it("is zero at the standard nil-rate threshold (145k)", () => {
    expect(calculateLbtt(145_000, false).totalTax).toBe(0);
  });

  it("charges 2% on the 145k–250k slice (250k → 2100)", () => {
    // (250_000 - 145_000) * 0.02 = 2100
    expect(calculateLbtt(250_000, false).totalTax).toBe(2_100);
  });

  it("applies the higher first-time-buyer nil-rate threshold (175k → 0)", () => {
    expect(calculateLbtt(175_000, true).totalTax).toBe(0);
    // A standard buyer at the same price pays tax on the 145k–175k slice.
    expect(calculateLbtt(175_000, false).totalTax).toBeGreaterThan(0);
  });

  it("computes a mid-range price (300k → 4600)", () => {
    expect(calculateLbtt(300_000, false).totalTax).toBe(4_600);
  });

  it("computes the 10% band (800k → 54350)", () => {
    expect(calculateLbtt(800_000, false).totalTax).toBe(54_350);
  });

  it("returns zero and an empty breakdown for non-positive price", () => {
    const result = calculateLbtt(0, false);
    expect(result.totalTax).toBe(0);
    expect(result.bands).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// LTT — Wales (no first-time-buyer relief)
// ---------------------------------------------------------------------------

describe("calculateLtt", () => {
  it("is zero at the nil-rate threshold (225k)", () => {
    expect(calculateLtt(225_000).totalTax).toBe(0);
  });

  it("charges 6% on the 225k–400k slice (300k → 4500)", () => {
    // (300_000 - 225_000) * 0.06 = 4500
    expect(calculateLtt(300_000).totalTax).toBe(4_500);
  });

  it("computes the top 12% band (2,000,000 → 171750)", () => {
    expect(calculateLtt(2_000_000).totalTax).toBe(171_750);
  });

  it("returns zero and an empty breakdown for non-positive price", () => {
    const result = calculateLtt(0);
    expect(result.totalTax).toBe(0);
    expect(result.bands).toEqual([]);
  });
});
