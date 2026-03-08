import { describe, it, expect } from "vitest";
import {
  SDLT_STANDARD,
  SDLT_FIRST_TIME_BUYER,
  SDLT_ADDITIONAL_PROPERTY_SURCHARGE,
  SDLT_FTB_PRICE_CAP,
} from "./sdlt-rates";

describe("SDLT rate band configuration", () => {
  it("SDLT_STANDARD has 5 bands with correct thresholds and rates", () => {
    expect(SDLT_STANDARD).toHaveLength(5);
    expect(SDLT_STANDARD[0]).toEqual({ threshold: 125_000, rate: 0 });
    expect(SDLT_STANDARD[1]).toEqual({ threshold: 250_000, rate: 0.02 });
    expect(SDLT_STANDARD[2]).toEqual({ threshold: 925_000, rate: 0.05 });
    expect(SDLT_STANDARD[3]).toEqual({ threshold: 1_500_000, rate: 0.10 });
    expect(SDLT_STANDARD[4]).toEqual({ threshold: Infinity, rate: 0.12 });
  });

  it("SDLT_FIRST_TIME_BUYER has 2 bands with correct thresholds and rates", () => {
    expect(SDLT_FIRST_TIME_BUYER).toHaveLength(2);
    expect(SDLT_FIRST_TIME_BUYER[0]).toEqual({ threshold: 300_000, rate: 0 });
    expect(SDLT_FIRST_TIME_BUYER[1]).toEqual({ threshold: 500_000, rate: 0.05 });
  });

  it("additional property surcharge is 5% (NOT 3%)", () => {
    expect(SDLT_ADDITIONAL_PROPERTY_SURCHARGE).toBe(0.05);
  });

  it("FTB price cap is 500,000", () => {
    expect(SDLT_FTB_PRICE_CAP).toBe(500_000);
  });
});
