import { describe, it, expect } from "vitest";
import {
  INSUFFICIENT_COLOUR,
  assignBucket,
  colourForBucket,
  priceColour,
} from "./colour";

// ---------------------------------------------------------------------------
// INSUFFICIENT_COLOUR constant
// ---------------------------------------------------------------------------

describe("INSUFFICIENT_COLOUR", () => {
  it("is the grey #9E9EAB", () => {
    expect(INSUFFICIENT_COLOUR).toBe("#9E9EAB");
  });
});

// ---------------------------------------------------------------------------
// colourForBucket — anchor values from DESIGN.md §4.2
// ---------------------------------------------------------------------------

describe("colourForBucket", () => {
  it("bucket 1 is forest green #2D5A3D", () => {
    expect(colourForBucket(1)).toBe("#2D5A3D");
  });

  it("bucket 2 is #4A7A52", () => {
    expect(colourForBucket(2)).toBe("#4A7A52");
  });

  it("bucket 3 is #7A9E6A", () => {
    expect(colourForBucket(3)).toBe("#7A9E6A");
  });

  it("bucket 4 is #B5C48A", () => {
    expect(colourForBucket(4)).toBe("#B5C48A");
  });

  it("bucket 5 is muted gold #C9A84C", () => {
    expect(colourForBucket(5)).toBe("#C9A84C");
  });

  it("bucket 6 is #C08A3A", () => {
    expect(colourForBucket(6)).toBe("#C08A3A");
  });

  it("bucket 7 is #A06030", () => {
    expect(colourForBucket(7)).toBe("#A06030");
  });

  it("bucket 8 is #8B3A28", () => {
    expect(colourForBucket(8)).toBe("#8B3A28");
  });

  it("bucket 9 is deep burgundy #6B1A1A", () => {
    expect(colourForBucket(9)).toBe("#6B1A1A");
  });
});

// ---------------------------------------------------------------------------
// assignBucket
// ---------------------------------------------------------------------------

describe("assignBucket", () => {
  const domain = { lo: 100_000, hi: 1_000_000 };

  it("price at or below lo returns bucket 1", () => {
    expect(assignBucket(100_000, domain)).toBe(1);
    expect(assignBucket(50_000, domain)).toBe(1);
  });

  it("price at or above hi returns bucket 9", () => {
    expect(assignBucket(1_000_000, domain)).toBe(9);
    expect(assignBucket(2_000_000, domain)).toBe(9);
  });

  it("price at midpoint of log scale returns bucket 5", () => {
    // midpoint of log10(100000..1000000): log10(100000)=5, log10(1000000)=6
    // t=0.5 → midLog = 5.5 → price = 10^5.5 ≈ 316227.766
    const midPrice = Math.pow(10, (Math.log10(100_000) + Math.log10(1_000_000)) / 2);
    // t=0.5 → bin index = floor(0.5*9)=4 (0-indexed) → bucket 5
    expect(assignBucket(midPrice, domain)).toBe(5);
  });

  it("degenerate case lo===hi returns bucket 5", () => {
    expect(assignBucket(500_000, { lo: 500_000, hi: 500_000 })).toBe(5);
  });

  it("price just above lo falls in bucket 1 (t≈0)", () => {
    // Very slightly above lo: t≈0 → bucket 1
    expect(assignBucket(100_001, domain)).toBe(1);
  });

  it("price just below hi falls in bucket 9 (t≈1)", () => {
    // Very slightly below hi: t≈1 → bucket 9
    expect(assignBucket(999_999, domain)).toBe(9);
  });

  it("returns integer bucket between 1 and 9", () => {
    const prices = [150_000, 250_000, 400_000, 600_000, 800_000];
    for (const price of prices) {
      const b = assignBucket(price, domain);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(Number.isInteger(b)).toBe(true);
    }
  });

  it("is monotonically non-decreasing with price", () => {
    const prices = [100_000, 150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000];
    const buckets = prices.map((p) => assignBucket(p, domain));
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i]).toBeGreaterThanOrEqual(buckets[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// priceColour
// ---------------------------------------------------------------------------

describe("priceColour", () => {
  const domain = { lo: 100_000, hi: 1_000_000 };

  it("returns grey fill and null bucket when transactionCount < 5", () => {
    const result = priceColour(500_000, 4, domain);
    expect(result.fill).toBe(INSUFFICIENT_COLOUR);
    expect(result.bucket).toBeNull();
  });

  it("returns grey fill and null bucket when transactionCount is 0", () => {
    const result = priceColour(500_000, 0, domain);
    expect(result.fill).toBe(INSUFFICIENT_COLOUR);
    expect(result.bucket).toBeNull();
  });

  it("returns grey fill and null bucket when transactionCount is 3", () => {
    const result = priceColour(500_000, 3, domain);
    expect(result.fill).toBe(INSUFFICIENT_COLOUR);
    expect(result.bucket).toBeNull();
  });

  it("returns grey fill and null bucket when price is null", () => {
    const result = priceColour(null, 50, domain);
    expect(result.fill).toBe(INSUFFICIENT_COLOUR);
    expect(result.bucket).toBeNull();
  });

  it("returns grey fill and null bucket when price is null AND count < 5", () => {
    const result = priceColour(null, 3, domain);
    expect(result.fill).toBe(INSUFFICIENT_COLOUR);
    expect(result.bucket).toBeNull();
  });

  it("returns valid bucket and fill when transactionCount is exactly 5", () => {
    const result = priceColour(100_000, 5, domain);
    expect(result.bucket).toBe(1);
    expect(result.fill).toBe("#2D5A3D");
  });

  it("returns bucket 9 and its colour for the highest price", () => {
    const result = priceColour(1_000_000, 30, domain);
    expect(result.bucket).toBe(9);
    expect(result.fill).toBe("#6B1A1A");
  });

  it("bucket and fill are consistent (fill === colourForBucket(bucket))", () => {
    const result = priceColour(500_000, 10, domain);
    expect(result.bucket).not.toBeNull();
    expect(result.fill).toBe(colourForBucket(result.bucket!));
  });
});
