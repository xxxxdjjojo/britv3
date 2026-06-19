import { describe, it, expect } from "vitest";
import {
  recencyWeight,
  distanceWeight,
  propertyTypeWeight,
  bedroomWeight,
  tenureWeight,
  newBuildWeight,
  similarityWeight,
} from "./weighting";

describe("recencyWeight", () => {
  it("is 1 for a sale today and decreases monotonically with age", () => {
    expect(recencyWeight(0)).toBeCloseTo(1, 5);
    expect(recencyWeight(12)).toBeLessThan(recencyWeight(6));
    expect(recencyWeight(36)).toBeLessThan(recencyWeight(12));
  });
  it("never returns a negative weight", () => {
    expect(recencyWeight(600)).toBeGreaterThanOrEqual(0);
  });
});

describe("distanceWeight", () => {
  it("is highest at zero distance and decreases with distance", () => {
    expect(distanceWeight(0)).toBeCloseTo(1, 5);
    expect(distanceWeight(1000)).toBeLessThan(distanceWeight(100));
  });
  it("treats unknown distance as a neutral mid weight, not zero", () => {
    expect(distanceWeight(null)).toBeGreaterThan(0);
  });
});

describe("propertyTypeWeight", () => {
  it("rewards an exact type match and penalises a mismatch", () => {
    expect(propertyTypeWeight("F", "F")).toBeGreaterThan(propertyTypeWeight("F", "D"));
  });
  it("treats detached vs semi as closer than detached vs flat", () => {
    expect(propertyTypeWeight("D", "S")).toBeGreaterThan(propertyTypeWeight("D", "F"));
  });
});

describe("bedroomWeight", () => {
  it("is neutral (1) when bedroom count is unknown for either property", () => {
    expect(bedroomWeight(null, 3)).toBe(1);
    expect(bedroomWeight(2, null)).toBe(1);
  });
  it("rewards a matching bedroom count over a large difference", () => {
    expect(bedroomWeight(3, 3)).toBeGreaterThan(bedroomWeight(1, 5));
  });
});

describe("tenureWeight / newBuildWeight", () => {
  it("penalises tenure and new-build mismatches", () => {
    expect(tenureWeight("F", "F")).toBeGreaterThan(tenureWeight("F", "L"));
    expect(newBuildWeight(false, false)).toBeGreaterThan(newBuildWeight(true, false));
  });
});

describe("similarityWeight", () => {
  const subject = { propertyType: "T" as const, tenure: "F" as const, newBuild: false, bedrooms: 3 };

  it("scores a near, recent, identical comparable higher than a far, old, different one", () => {
    const near = similarityWeight(
      { propertyType: "T", tenure: "F", newBuild: false, bedrooms: 3, distanceMetres: 80, monthsAgo: 3 },
      subject,
    );
    const far = similarityWeight(
      { propertyType: "F", tenure: "L", newBuild: true, bedrooms: 1, distanceMetres: 4000, monthsAgo: 34 },
      subject,
    );
    expect(near).toBeGreaterThan(far);
    expect(near).toBeGreaterThan(0);
  });
});
