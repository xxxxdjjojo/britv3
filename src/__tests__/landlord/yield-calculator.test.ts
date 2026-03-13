/**
 * Test stubs for yield-calculator covering LD-11.
 * These are Wave 0 stubs — implementation ships in plan 14-11.
 */
import { describe, it } from "vitest";

describe("yield-calculator", () => {
  describe("calculateYield", () => {
    it.todo("gross yield = (annual_rent / property_value) * 100");
    it.todo(
      "net yield = ((annual_rent - annual_costs) / property_value) * 100",
    );
    it.todo("handles zero property value without divide-by-zero error");
    it.todo("returns percentages rounded to 2 decimal places");
  });
});
