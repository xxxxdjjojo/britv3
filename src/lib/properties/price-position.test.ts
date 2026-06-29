import { describe, it, expect } from "vitest";
import {
  assessValuePosition,
  valueRatingLabel,
  bandForPropertyType,
} from "./price-position";

describe("assessValuePosition", () => {
  it("grades a price >5% below the median as good value", () => {
    const r = assessValuePosition(560000, 600000);
    expect(r?.rating).toBe("good_value");
    expect(r?.deltaPct).toBeCloseTo(-0.0667, 3);
  });

  it("grades a price within the band as fair", () => {
    expect(assessValuePosition(600000, 600000)?.rating).toBe("fair");
    expect(assessValuePosition(620000, 600000)?.rating).toBe("fair");
  });

  it("grades a price >=10% above the median as above market", () => {
    expect(assessValuePosition(660000, 600000)?.rating).toBe("above_market");
  });

  it("returns null when either price is missing or non-positive", () => {
    expect(assessValuePosition(0, 600000)).toBeNull();
    expect(assessValuePosition(600000, 0)).toBeNull();
  });
});

describe("bandForPropertyType", () => {
  it("maps flat-like types to flat", () => {
    for (const t of ["flat", "studio", "maisonette", "penthouse"]) {
      expect(bandForPropertyType(t)).toBe("flat");
    }
  });
  it("maps everything else to house", () => {
    for (const t of ["detached", "semi_detached", "terraced", "bungalow"]) {
      expect(bandForPropertyType(t)).toBe("house");
    }
  });
});

describe("valueRatingLabel", () => {
  it("labels each rating", () => {
    expect(valueRatingLabel("good_value")).toBe("Good value");
    expect(valueRatingLabel("fair")).toBe("Fair price");
    expect(valueRatingLabel("above_market")).toBe("Above market");
  });
});
