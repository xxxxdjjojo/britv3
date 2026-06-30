/**
 * Tests for the platform-fee lever.
 *
 * Commercial rule: TrueDeed takes ZERO commission on trader job payments.
 * Monetisation is the monthly trader subscription only. This module is the
 * single configurable lever — default rate must be 0%.
 */

import { describe, expect, it } from "vitest";

import { PLATFORM_FEE_RATE, platformFeePence } from "./platform-fee";

describe("PLATFORM_FEE_RATE", () => {
  it("defaults to 0% (no commission on jobs)", () => {
    expect(PLATFORM_FEE_RATE).toBe(0);
  });
});

describe("platformFeePence", () => {
  it("returns 0 at the default (0%) rate regardless of amount", () => {
    expect(platformFeePence(10000)).toBe(0);
    expect(platformFeePence(999_999)).toBe(0);
  });

  it("remains configurable — computes a fee when an explicit rate is supplied", () => {
    expect(platformFeePence(10000, 0.025)).toBe(250);
    expect(platformFeePence(12345, 0.1)).toBe(1235); // rounds to nearest pence
  });

  it("never returns a negative or fractional fee", () => {
    expect(platformFeePence(0, 0.5)).toBe(0);
    expect(platformFeePence(-100, 0.5)).toBe(0);
    expect(Number.isInteger(platformFeePence(12345, 0.2))).toBe(true);
  });

  it("treats an out-of-range configured rate as 0 (fail-safe)", () => {
    expect(platformFeePence(10000, -0.1)).toBe(0);
    expect(platformFeePence(10000, 1)).toBe(0);
    expect(platformFeePence(10000, Number.NaN)).toBe(0);
  });
});
