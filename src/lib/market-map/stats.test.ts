import { describe, it, expect } from "vitest";
import { quantile, median } from "./stats";

describe("median", () => {
  it("returns the middle value for an odd-length array", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("averages the two middle values for an even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it("does not mutate the input", () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
  it("returns NaN for an empty array", () => {
    expect(median([])).toBeNaN();
  });
});

describe("quantile", () => {
  it("returns the min at q=0 and max at q=1", () => {
    expect(quantile([10, 20, 30, 40], 0)).toBe(10);
    expect(quantile([10, 20, 30, 40], 1)).toBe(40);
  });
  it("interpolates linearly between ranks", () => {
    // sorted [100,200,300,400], pos for p10 = 0.3 -> 100 + 0.3*100 = 130
    expect(quantile([400, 100, 300, 200], 0.1)).toBe(130);
  });
  it("clamps q outside [0,1]", () => {
    expect(quantile([5, 9], 2)).toBe(9);
    expect(quantile([5, 9], -1)).toBe(5);
  });
});
