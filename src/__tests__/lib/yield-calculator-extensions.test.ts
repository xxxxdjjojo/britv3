import { describe, it, expect } from "vitest";
import {
  safeDivide,
  calcCashflow,
  calcOccupancyRate,
  formatMetric,
} from "@/lib/yield-calculator";

describe("safeDivide", () => {
  it("returns result for valid division", () => {
    expect(safeDivide(100, 4)).toBe(25);
  });
  it("returns null for division by zero", () => {
    expect(safeDivide(100, 0)).toBeNull();
  });
  it("returns null for NaN inputs", () => {
    expect(safeDivide(NaN, 5)).toBeNull();
  });
});

describe("calcCashflow", () => {
  it("calculates monthly net", () => {
    expect(calcCashflow(1200, 800)).toBe(400);
  });
  it("handles negative cashflow", () => {
    expect(calcCashflow(800, 1200)).toBe(-400);
  });
});

describe("calcOccupancyRate", () => {
  it("calculates percentage", () => {
    expect(calcOccupancyRate(9, 10)).toBe(90);
  });
  it("returns 0 when no properties", () => {
    expect(calcOccupancyRate(0, 0)).toBe(0);
  });
});

describe("formatMetric", () => {
  it("formats number with suffix", () => {
    expect(formatMetric(6.5, "%")).toBe("6.5%");
  });
  it("returns em dash for null", () => {
    expect(formatMetric(null)).toBe("\u2014");
  });
});
