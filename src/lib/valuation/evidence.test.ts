import { describe, it, expect } from "vitest";
import { classifyEvidence } from "./evidence";

describe("classifyEvidence", () => {
  it("returns unavailable / level E when there are no comparables", () => {
    const r = classifyEvidence({
      hasExactPriorSale: false,
      comparableCount: 0,
      effectiveComparableCount: 0,
      nearestDistanceM: null,
      medianMonthsAgo: null,
      sameTypeShare: 0,
    });
    expect(r.evidenceQuality).toBe("unavailable");
    expect(r.fallbackLevel).toBe("E");
  });

  it("returns high / level A with an exact prior sale and strong nearby comps", () => {
    const r = classifyEvidence({
      hasExactPriorSale: true,
      comparableCount: 9,
      effectiveComparableCount: 7,
      nearestDistanceM: 80,
      medianMonthsAgo: 6,
      sameTypeShare: 0.9,
    });
    expect(r.evidenceQuality).toBe("high");
    expect(r.fallbackLevel).toBe("A");
  });

  it("returns medium / level B-C for usable but imperfect evidence", () => {
    const r = classifyEvidence({
      hasExactPriorSale: false,
      comparableCount: 6,
      effectiveComparableCount: 4,
      nearestDistanceM: 400,
      medianMonthsAgo: 14,
      sameTypeShare: 0.8,
    });
    expect(r.evidenceQuality).toBe("medium");
    expect(["B", "C"]).toContain(r.fallbackLevel);
  });

  it("returns low / level D for sparse, distant or stale evidence", () => {
    const r = classifyEvidence({
      hasExactPriorSale: false,
      comparableCount: 2,
      effectiveComparableCount: 1.2,
      nearestDistanceM: 2500,
      medianMonthsAgo: 30,
      sameTypeShare: 0.5,
    });
    expect(r.evidenceQuality).toBe("low");
    expect(r.fallbackLevel).toBe("D");
  });
});
