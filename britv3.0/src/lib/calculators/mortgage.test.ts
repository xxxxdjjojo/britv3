import { describe, it, expect } from "vitest";
import {
  calculateMonthlyPayment,
  calculateTotalRepayable,
  calculateAffordability,
} from "./mortgage";

describe("calculateMonthlyPayment", () => {
  it("returns correct payment for 200K @ 5% / 25yr", () => {
    expect(calculateMonthlyPayment(200_000, 5, 25)).toBeCloseTo(1169.18, 2);
  });

  it("returns correct payment for 300K @ 4.5% / 30yr", () => {
    expect(calculateMonthlyPayment(300_000, 4.5, 30)).toBeCloseTo(1520.06, 2);
  });

  it("handles zero interest rate (P / (n*12))", () => {
    expect(calculateMonthlyPayment(100_000, 0, 25)).toBeCloseTo(333.33, 2);
  });

  it("returns 0 for zero principal", () => {
    expect(calculateMonthlyPayment(0, 5, 25)).toBe(0);
  });

  it("returns 0 for zero term", () => {
    expect(calculateMonthlyPayment(200_000, 5, 0)).toBe(0);
  });

  it("returns 0 for negative principal", () => {
    expect(calculateMonthlyPayment(-100_000, 5, 25)).toBe(0);
  });
});

describe("calculateTotalRepayable", () => {
  it("returns correct totals for 200K @ 5% / 25yr", () => {
    const result = calculateTotalRepayable(200_000, 5, 25);
    expect(result.totalRepayable).toBeCloseTo(350_754, 0);
    expect(result.totalInterest).toBeCloseTo(150_754, 0);
  });
});

describe("calculateAffordability", () => {
  it("calculates payment for property price minus deposit", () => {
    const result = calculateAffordability(350_000, 50_000, 4.5, 25);
    // Principal = 300K, so should match calculateMonthlyPayment(300_000, 4.5, 25)
    const expectedMonthly = calculateMonthlyPayment(300_000, 4.5, 25);
    expect(result.monthlyPayment).toBeCloseTo(expectedMonthly, 2);
  });

  it("returns zero if deposit >= price", () => {
    const result = calculateAffordability(100_000, 100_000, 4.5, 25);
    expect(result.monthlyPayment).toBe(0);
  });

  it("returns zero if deposit > price", () => {
    const result = calculateAffordability(100_000, 150_000, 4.5, 25);
    expect(result.monthlyPayment).toBe(0);
  });
});
