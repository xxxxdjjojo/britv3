import { describe, it, expect } from "vitest";
import { assignColours, bucketForLog } from "./colour";
import { PRICE_RAMP, INSUFFICIENT_COLOUR } from "./constants";

describe("assignColours", () => {
  it("maps cheaper areas to lower (lighter-green) buckets than pricier areas", () => {
    const areas = [
      { medianPrice: 300_000, transactionCount: 100 },
      { medianPrice: 600_000, transactionCount: 100 },
      { medianPrice: 1_200_000, transactionCount: 100 },
    ];
    const [cheap, mid, dear] = assignColours(areas);
    expect(cheap.colourBucket).toBeLessThan(mid.colourBucket!);
    expect(mid.colourBucket).toBeLessThan(dear.colourBucket!);
    expect(cheap.fillColour).toBe(PRICE_RAMP[cheap.colourBucket!]);
  });

  it("greys out and nulls the bucket for insufficient-data areas", () => {
    const [ok, insufficient] = assignColours([
      { medianPrice: 500_000, transactionCount: 50 },
      { medianPrice: 500_000, transactionCount: 4 },
    ]);
    expect(ok.colourBucket).not.toBeNull();
    expect(insufficient.colourBucket).toBeNull();
    expect(insufficient.fillColour).toBe(INSUFFICIENT_COLOUR);
  });

  it("clamps a single luxury outlier so it does not wash out the scale", () => {
    // 20 normal areas spread 400k–590k, plus one extreme outlier. Because the
    // domain is clamped to the 5th–95th percentile of area medians, the lone
    // outlier is pushed out of the domain instead of stretching it, so the
    // normal areas still spread across the ramp rather than collapsing to one.
    const normal = Array.from({ length: 20 }, (_, i) => ({
      medianPrice: 400_000 + i * 10_000,
      transactionCount: 100,
    }));
    const colours = assignColours([
      ...normal,
      { medianPrice: 50_000_000, transactionCount: 100 },
    ]);
    const normalBuckets = colours.slice(0, 20).map((c) => c.colourBucket!);
    expect(Math.max(...normalBuckets)).toBeGreaterThan(Math.min(...normalBuckets));
    // The outlier clamps to the top of the ramp.
    expect(colours[20].colourBucket).toBe(PRICE_RAMP.length - 1);
  });

  it("puts a single area in the middle bucket (degenerate domain)", () => {
    const [only] = assignColours([{ medianPrice: 500_000, transactionCount: 40 }]);
    expect(only.colourBucket).toBe(Math.floor((PRICE_RAMP.length - 1) / 2));
  });
});

describe("bucketForLog", () => {
  it("returns endpoints for the domain bounds", () => {
    expect(bucketForLog(2, 2, 4)).toBe(0);
    expect(bucketForLog(4, 2, 4)).toBe(PRICE_RAMP.length - 1);
  });
  it("clamps values outside the domain", () => {
    expect(bucketForLog(1, 2, 4)).toBe(0);
    expect(bucketForLog(9, 2, 4)).toBe(PRICE_RAMP.length - 1);
  });
  it("returns the middle bucket for a degenerate domain", () => {
    expect(bucketForLog(3, 3, 3)).toBe(Math.floor((PRICE_RAMP.length - 1) / 2));
  });
});
