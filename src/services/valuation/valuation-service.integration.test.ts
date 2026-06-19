import { describe, it, expect } from "vitest";
import { calculateValuation } from "./valuation-service";
import type { ValuationSubject } from "@/types/valuation";

/**
 * Integration test against the real, already-loaded HM Land Registry
 * `price_paid_data` (~31M rows). Gated behind RUN_VALUATION_DB=1 and
 * SUPABASE_DB_URL so the normal unit suite never hits the network DB.
 *
 *   SUPABASE_DB_URL=... RUN_VALUATION_DB=1 npx vitest run \
 *     src/services/valuation/valuation-service.integration.test.ts
 */
const ENABLED = process.env.RUN_VALUATION_DB === "1" && Boolean(process.env.SUPABASE_DB_URL);

describe.runIf(ENABLED)("calculateValuation (real Land Registry data)", () => {
  const valuationDate = "2026-02-27";

  it("produces a plausible indicative estimate for a real SW18 terraced house", async () => {
    const subject: ValuationSubject = {
      postcode: "SW18 4QN",
      outwardCode: "SW18",
      propertyType: "T",
      tenure: "F",
      newBuild: false,
      bedrooms: 3,
      bathrooms: 1,
      floorAreaSqm: null,
      condition: "average",
      paon: "10",
      saon: null,
      street: "DUNTSHILL ROAD",
    };

    const result = await calculateValuation({ subject, valuationDate, dataCutoffDate: valuationDate });

    expect(result.modelVersion).toBe("vmp-comparables-1.1.0");
    expect(result.comparableCount).toBeGreaterThan(0);
    expect(result.estimatedValue).not.toBeNull();
    // London terraced houses: sane, non-fabricated bounds.
    expect(result.estimatedValue!).toBeGreaterThan(150_000);
    expect(result.estimatedValue!).toBeLessThan(5_000_000);
    expect(result.estimatedValue! % 5000).toBe(0);
    expect(result.estimatedLow!).toBeLessThan(result.estimatedValue!);
    expect(result.estimatedHigh!).toBeGreaterThan(result.estimatedValue!);
    expect(result.comparableSales.length).toBeGreaterThan(0);

    // Visibility when running with --reporter verbose.
    console.log(
      `[VMP] SW18 4QN terraced: £${result.estimatedValue?.toLocaleString()} ` +
        `(£${result.estimatedLow?.toLocaleString()}–£${result.estimatedHigh?.toLocaleString()}), ` +
        `${result.evidenceQuality}/${result.fallbackLevel}, ` +
        `${result.comparableCount} comps (eff ${result.effectiveComparableCount.toFixed(1)})`,
    );
  });

  it("declines to estimate for a Scottish postcode (absent from the data)", async () => {
    const subject: ValuationSubject = {
      postcode: "EH1 1BB",
      outwardCode: "EH1",
      propertyType: "F",
      tenure: "L",
      newBuild: false,
      bedrooms: 2,
      bathrooms: 1,
      floorAreaSqm: null,
      condition: "average",
      paon: null,
      saon: null,
      street: null,
    };

    const result = await calculateValuation({ subject, valuationDate });
    expect(result.estimatedValue).toBeNull();
    expect(result.fallbackLevel).toBe("E");
    expect(result.limitations.join(" ").toLowerCase()).toContain("agent");
  });
});
