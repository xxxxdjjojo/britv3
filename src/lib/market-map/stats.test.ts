import { describe, it, expect } from "vitest";
import {
  percentile,
  median,
  computeClampBounds,
  clamp,
} from "./stats";

// ---------------------------------------------------------------------------
// percentile
// ---------------------------------------------------------------------------

describe("percentile", () => {
  it("throws RangeError on empty array", () => {
    expect(() => percentile([], 50)).toThrow(RangeError);
  });

  it("throws RangeError when p < 0", () => {
    expect(() => percentile([1, 2, 3], -1)).toThrow(RangeError);
  });

  it("throws RangeError when p > 100", () => {
    expect(() => percentile([1, 2, 3], 101)).toThrow(RangeError);
  });

  it("single element always returns that element", () => {
    expect(percentile([42], 0)).toBe(42);
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 100)).toBe(42);
  });

  it("p=0 returns minimum", () => {
    expect(percentile([3, 1, 2], 0)).toBe(1);
  });

  it("p=100 returns maximum", () => {
    expect(percentile([3, 1, 2], 100)).toBe(3);
  });

  it("does not mutate the input array", () => {
    const arr = [3, 1, 2];
    const copy = [...arr];
    percentile(arr, 50);
    expect(arr).toEqual(copy);
  });

  it("two-element: p=50 is average", () => {
    // type-7 / numpy default: index = p/100 * (n-1) = 0.5*(1) = 0.5
    // floor(0.5)=0, frac=0.5 → arr[0] + 0.5*(arr[1]-arr[0]) = 10 + 0.5*10 = 15
    expect(percentile([10, 20], 50)).toBe(15);
  });

  it("four-element: percentile(10) interpolation", () => {
    // sorted: [10,20,30,40], n=4
    // idx = 0.10 * 3 = 0.3 → lo=arr[0]=10, hi=arr[1]=20, frac=0.3
    // result = 10 + 0.3*(20-10) = 13
    expect(percentile([10, 20, 30, 40], 10)).toBeCloseTo(13, 10);
  });

  it("four-element: p=50 returns average of middle two", () => {
    // idx = 0.5 * 3 = 1.5 → arr[1]=20, arr[2]=30, frac=0.5
    // result = 20 + 0.5*10 = 25
    expect(percentile([10, 20, 30, 40], 50)).toBe(25);
  });

  it("four-element: p=75 returns correct interpolation", () => {
    // idx = 0.75 * 3 = 2.25 → arr[2]=30, arr[3]=40, frac=0.25
    // result = 30 + 0.25*10 = 32.5
    expect(percentile([10, 20, 30, 40], 75)).toBe(32.5);
  });

  it("five-element odd: p=50 returns exact middle", () => {
    // idx = 0.5 * 4 = 2 → exact: arr[2] = 30
    expect(percentile([10, 20, 30, 40, 50], 50)).toBe(30);
  });

  it("handles unsorted input", () => {
    expect(percentile([40, 10, 30, 20], 50)).toBe(25);
  });

  it("p=5 on realistic values", () => {
    // sorted: [100,200,300,400,500,600,700,800,900,1000], n=10
    // idx = 0.05 * 9 = 0.45 → arr[0]=100, arr[1]=200, frac=0.45
    // result = 100 + 0.45*100 = 145
    const vals = [500, 100, 900, 300, 700, 200, 800, 400, 600, 1000];
    expect(percentile(vals, 5)).toBeCloseTo(145, 10);
  });

  it("p=95 on realistic values", () => {
    // sorted: [100..1000], n=10
    // idx = 0.95 * 9 = 8.55 → arr[8]=900, arr[9]=1000, frac=0.55
    // result = 900 + 0.55*100 = 955
    const vals = [500, 100, 900, 300, 700, 200, 800, 400, 600, 1000];
    expect(percentile(vals, 95)).toBeCloseTo(955, 10);
  });
});

// ---------------------------------------------------------------------------
// median
// ---------------------------------------------------------------------------

describe("median", () => {
  it("delegates to percentile(values, 50)", () => {
    expect(median([1, 2, 3])).toBe(2);
  });

  it("even-length: averages two middle values", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("throws RangeError on empty array", () => {
    expect(() => median([])).toThrow(RangeError);
  });

  it("single element", () => {
    expect(median([7])).toBe(7);
  });

  it("does not mutate input", () => {
    const arr = [3, 1, 2];
    const copy = [...arr];
    median(arr);
    expect(arr).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// computeClampBounds
// ---------------------------------------------------------------------------

describe("computeClampBounds", () => {
  it("returns p5/p95 by default", () => {
    const vals = [500, 100, 900, 300, 700, 200, 800, 400, 600, 1000];
    const { lo, hi } = computeClampBounds(vals);
    expect(lo).toBeCloseTo(percentile(vals, 5), 10);
    expect(hi).toBeCloseTo(percentile(vals, 95), 10);
  });

  it("returns custom percentiles when specified", () => {
    const vals = [100, 200, 300, 400, 500];
    const { lo, hi } = computeClampBounds(vals, 25, 75);
    expect(lo).toBeCloseTo(percentile(vals, 25), 10);
    expect(hi).toBeCloseTo(percentile(vals, 75), 10);
  });

  it("lo is less than hi for varied data", () => {
    const vals = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const { lo, hi } = computeClampBounds(vals);
    expect(lo).toBeLessThan(hi);
  });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe("clamp", () => {
  it("returns value when within bounds", () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });

  it("clamps to lo when value is below lo", () => {
    expect(clamp(0, 1, 10)).toBe(1);
  });

  it("clamps to hi when value is above hi", () => {
    expect(clamp(15, 1, 10)).toBe(10);
  });

  it("returns lo when value equals lo", () => {
    expect(clamp(1, 1, 10)).toBe(1);
  });

  it("returns hi when value equals hi", () => {
    expect(clamp(10, 1, 10)).toBe(10);
  });

  it("works with negative numbers", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});
