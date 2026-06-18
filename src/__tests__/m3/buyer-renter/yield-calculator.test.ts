/**
 * M3-A8 — Rental yield calculator (pure logic).
 *
 * Gross yield: (annual_rent / property_value) * 100
 * Net yield:   ((annual_rent - annual_costs) / property_value) * 100
 *
 * Values verified against the implementation before asserting.
 */

import { describe, it, expect } from "vitest";

import {
  calculateYield,
  safeDivide,
  calcCashflow,
  calcOccupancyRate,
  formatMetric,
} from "@/lib/yield-calculator";

const BASE_INPUTS = {
  propertyValue: 200_000,
  monthlyRent: 1_000,
  monthlyManagementFee: 100,
  monthlyMaintenance: 50,
  monthlyInsurance: 25,
  monthlyMortgage: 500,
} as const;

describe("calculateYield", () => {
  it("computes gross and net yield for a typical BTL", () => {
    const result = calculateYield({ ...BASE_INPUTS });
    // annualRent = 12_000; gross = 12_000 / 200_000 * 100 = 6
    expect(result.grossYield).toBe(6);
    expect(result.annualRent).toBe(12_000);
    // annualCosts = (100+50+25+500)*12 = 8100; net = (12000-8100)/200000*100 = 1.95
    expect(result.annualCosts).toBe(8_100);
    expect(result.netYield).toBe(1.95);
    expect(result.annualNet).toBe(3_900);
  });

  it("returns all-zero values when propertyValue is 0 (no divide-by-zero)", () => {
    const result = calculateYield({ ...BASE_INPUTS, propertyValue: 0 });
    expect(result).toEqual({
      grossYield: 0,
      netYield: 0,
      annualRent: 0,
      annualCosts: 0,
      annualNet: 0,
    });
  });

  it("produces a negative net yield when costs exceed rent", () => {
    const result = calculateYield({
      ...BASE_INPUTS,
      monthlyRent: 400,
      monthlyMortgage: 900,
    });
    expect(result.netYield).toBeLessThan(0);
    expect(result.annualNet).toBeLessThan(0);
  });

  it("gross equals net when there are no costs", () => {
    const result = calculateYield({
      propertyValue: 250_000,
      monthlyRent: 1_500,
      monthlyManagementFee: 0,
      monthlyMaintenance: 0,
      monthlyInsurance: 0,
      monthlyMortgage: 0,
    });
    expect(result.grossYield).toBe(result.netYield);
  });

  it("rounds yields to 2 decimal places", () => {
    const result = calculateYield({
      ...BASE_INPUTS,
      propertyValue: 333_333,
      monthlyRent: 1_111,
    });
    expect(Number((result.grossYield * 100).toFixed(0))).toBe(
      result.grossYield * 100,
    );
  });
});

describe("safeDivide", () => {
  it("divides normally", () => {
    expect(safeDivide(10, 2)).toBe(5);
  });

  it("returns null when dividing by zero", () => {
    expect(safeDivide(10, 0)).toBeNull();
  });

  it("returns null for non-finite inputs", () => {
    expect(safeDivide(Infinity, 2)).toBeNull();
    expect(safeDivide(10, NaN)).toBeNull();
  });
});

describe("calcCashflow", () => {
  it("subtracts expenses from income", () => {
    expect(calcCashflow(2_000, 1_500)).toBe(500);
  });

  it("can be negative", () => {
    expect(calcCashflow(1_000, 1_500)).toBe(-500);
  });
});

describe("calcOccupancyRate", () => {
  it("computes the occupancy percentage rounded to 1dp", () => {
    expect(calcOccupancyRate(3, 4)).toBe(75);
  });

  it("returns 0 when there are no units (no divide-by-zero)", () => {
    expect(calcOccupancyRate(0, 0)).toBe(0);
  });

  it("returns 100 for fully occupied", () => {
    expect(calcOccupancyRate(5, 5)).toBe(100);
  });
});

describe("formatMetric", () => {
  it("appends the default % suffix", () => {
    expect(formatMetric(6.25)).toBe("6.25%");
  });

  it("renders an em-dash for null", () => {
    expect(formatMetric(null)).toBe("—");
  });

  it("supports a custom suffix", () => {
    expect(formatMetric(1200, " GBP")).toBe("1200 GBP");
  });
});
