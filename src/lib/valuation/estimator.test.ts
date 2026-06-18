import { describe, it, expect } from "vitest";
import { weightedMedian, weightedTrimmedMean, robustEstimate } from "./estimator";

describe("weightedMedian", () => {
  it("equals the plain median when weights are equal", () => {
    expect(weightedMedian([100, 200, 300], [1, 1, 1])).toBe(200);
  });

  it("is pulled toward the value carrying the most weight", () => {
    // 300 carries the dominant weight, so the weighted median sits at 300.
    expect(weightedMedian([100, 200, 300], [1, 1, 10])).toBe(300);
  });

  it("is not dominated by a single anomalous low-weight sale", () => {
    // A £30k outlier with tiny weight must not drag the estimate down.
    const values = [400_000, 410_000, 420_000, 30_000];
    const weights = [1, 1, 1, 0.01];
    const result = weightedMedian(values, weights);
    expect(result).toBeGreaterThanOrEqual(400_000);
  });

  it("throws on empty input rather than returning a misleading 0", () => {
    expect(() => weightedMedian([], [])).toThrow();
  });

  it("rejects mismatched value/weight lengths", () => {
    expect(() => weightedMedian([1, 2], [1])).toThrow();
  });
});

describe("weightedTrimmedMean", () => {
  it("drops the extreme tails before averaging", () => {
    // With a 25% trim the 1 and 1000 are removed; mean of 10,20,30 = 20.
    const values = [1, 10, 20, 30, 1000];
    const weights = [1, 1, 1, 1, 1];
    expect(weightedTrimmedMean(values, weights, 0.2)).toBeCloseTo(20, 5);
  });

  it("returns the weighted mean when trim is 0", () => {
    expect(weightedTrimmedMean([10, 20], [1, 3], 0)).toBeCloseTo(17.5, 5);
  });
});

describe("robustEstimate", () => {
  it("combines weighted median and trimmed mean and is resistant to one wild sale", () => {
    const comps = [
      { value: 500_000, weight: 1 },
      { value: 510_000, weight: 1 },
      { value: 495_000, weight: 1 },
      { value: 505_000, weight: 1 },
      { value: 5_000_000, weight: 1 }, // wild high sale
    ];
    const est = robustEstimate(comps);
    expect(est).toBeGreaterThan(450_000);
    expect(est).toBeLessThan(700_000); // the £5m sale must not blow it up
  });
});
