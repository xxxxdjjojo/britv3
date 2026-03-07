import { describe, it, expect } from "vitest";
import { calculateSdlt } from "./sdlt";

describe("calculateSdlt", () => {
  describe("standard buyer", () => {
    it("calculates correctly at 250K", () => {
      // 125K @ 0% = 0, 125K @ 2% = 2,500
      const result = calculateSdlt(250_000, "standard");
      expect(result.totalTax).toBe(2_500);
    });

    it("calculates correctly at 500K", () => {
      // 125K @ 0% = 0, 125K @ 2% = 2,500, 250K @ 5% = 12,500
      const result = calculateSdlt(500_000, "standard");
      expect(result.totalTax).toBe(15_000);
    });

    it("calculates correctly at 1M", () => {
      // 125K @ 0% = 0, 125K @ 2% = 2,500, 675K @ 5% = 33,750, 75K @ 10% = 7,500
      const result = calculateSdlt(1_000_000, "standard");
      expect(result.totalTax).toBe(41_250);
      // Effective rate: 41,250 / 1,000,000 = 4.125%
      expect(result.effectiveRate).toBeCloseTo(0.04125, 5);
    });
  });

  describe("first-time buyer", () => {
    it("pays zero tax at 300K (full relief)", () => {
      const result = calculateSdlt(300_000, "first_time");
      expect(result.totalTax).toBe(0);
    });

    it("calculates correctly at 450K", () => {
      // 300K @ 0% = 0, 150K @ 5% = 7,500
      const result = calculateSdlt(450_000, "first_time");
      expect(result.totalTax).toBe(7_500);
    });

    it("uses STANDARD rates when price exceeds 500K cap", () => {
      // Falls back to standard: 125K @ 0%, 125K @ 2% = 2,500, 250K @ 5% = 12,500, 100K @ 5% = 5,000
      const result = calculateSdlt(600_000, "first_time");
      expect(result.totalTax).toBe(20_000);
    });
  });

  describe("additional property", () => {
    it("calculates correctly at 250K (5% surcharge on all bands)", () => {
      // 125K @ (0%+5%) = 6,250, 125K @ (2%+5%) = 8,750
      const result = calculateSdlt(250_000, "additional");
      expect(result.totalTax).toBe(15_000);
    });

    it("calculates correctly at 500K", () => {
      // 125K @ 5% = 6,250, 125K @ 7% = 8,750, 250K @ 10% = 25,000
      const result = calculateSdlt(500_000, "additional");
      expect(result.totalTax).toBe(40_000);
    });
  });

  describe("edge cases", () => {
    it("returns zero for price = 0", () => {
      const result = calculateSdlt(0, "standard");
      expect(result.totalTax).toBe(0);
      expect(result.effectiveRate).toBe(0);
      expect(result.bands).toHaveLength(0);
    });

    it("returns zero for negative price", () => {
      const result = calculateSdlt(-100_000, "standard");
      expect(result.totalTax).toBe(0);
    });
  });

  describe("band breakdown", () => {
    it("returns correct per-band breakdown for 500K standard", () => {
      const result = calculateSdlt(500_000, "standard");
      expect(result.bands).toEqual([
        { from: 0, to: 125_000, rate: 0, tax: 0 },
        { from: 125_000, to: 250_000, rate: 0.02, tax: 2_500 },
        { from: 250_000, to: 500_000, rate: 0.05, tax: 12_500 },
      ]);
    });
  });
});
