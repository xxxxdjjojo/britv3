/**
 * Tests for yield-calculator covering LD-11 gross and net yield calculations.
 */
import { describe, it, expect } from "vitest";
import { calculateYield } from "@/lib/yield-calculator";

describe("yield-calculator", () => {
  describe("calculateYield", () => {
    it("gross yield = (annual_rent / property_value) * 100", () => {
      const result = calculateYield({
        propertyValue: 300000,
        monthlyRent: 1500,
        monthlyManagementFee: 0,
        monthlyMaintenance: 0,
        monthlyInsurance: 0,
        monthlyMortgage: 0,
      });
      // annual_rent = 1500 * 12 = 18000; grossYield = 18000/300000*100 = 6
      expect(result.grossYield).toBe(6);
    });

    it("net yield = ((annual_rent - annual_costs) / property_value) * 100", () => {
      const result = calculateYield({
        propertyValue: 300000,
        monthlyRent: 1500,
        monthlyManagementFee: 100,
        monthlyMaintenance: 50,
        monthlyInsurance: 50,
        monthlyMortgage: 0,
      });
      // annual_rent = 18000; annual_costs = 200*12 = 2400; net = 15600/300000*100 = 5.2
      expect(result.netYield).toBe(5.2);
    });

    it("handles zero property value without divide-by-zero error", () => {
      const result = calculateYield({
        propertyValue: 0,
        monthlyRent: 1500,
        monthlyManagementFee: 0,
        monthlyMaintenance: 0,
        monthlyInsurance: 0,
        monthlyMortgage: 0,
      });
      expect(result.grossYield).toBe(0);
      expect(result.netYield).toBe(0);
    });

    it("returns percentages rounded to 2 decimal places", () => {
      const result = calculateYield({
        propertyValue: 300000,
        monthlyRent: 1234,
        monthlyManagementFee: 0,
        monthlyMaintenance: 0,
        monthlyInsurance: 0,
        monthlyMortgage: 0,
      });
      // Should have at most 2 decimal places
      const grossStr = result.grossYield.toString();
      const netStr = result.netYield.toString();
      const grossDecimals = grossStr.includes(".") ? grossStr.split(".")[1].length : 0;
      const netDecimals = netStr.includes(".") ? netStr.split(".")[1].length : 0;
      expect(grossDecimals).toBeLessThanOrEqual(2);
      expect(netDecimals).toBeLessThanOrEqual(2);
    });
  });
});
