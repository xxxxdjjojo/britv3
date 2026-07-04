import { describe, expect, it } from "vitest";

import {
  buyerInterestScore,
  dataQualityScore,
  freshnessScore,
  pricePerSqft,
  priceDropPct,
  rankCandidates,
} from "@/lib/top-properties/top-list-scoring";
import { getTopListCategory } from "@/lib/top-properties/top-list-config";
import type { TopListCategory } from "@/lib/top-properties/types";
import { makeCandidate } from "./fixtures";

const NOW = new Date("2026-07-03T12:00:00Z");

function category(slug: string): TopListCategory {
  const c = getTopListCategory(slug);
  if (!c) throw new Error(`missing category ${slug}`);
  return c;
}

describe("buyerInterestScore", () => {
  it("weights saves double on a log scale", () => {
    const views = buyerInterestScore({ viewCount: 100, favoriteCount: 0, enquiryCount: 0 });
    const saves = buyerInterestScore({ viewCount: 0, favoriteCount: 100, enquiryCount: 0 });
    expect(saves).toBeGreaterThan(views);
    expect(saves).toBeCloseTo(2 * Math.log1p(100), 5);
  });

  it("is zero with no engagement", () => {
    expect(
      buyerInterestScore({ viewCount: 0, favoriteCount: 0, enquiryCount: 0 }),
    ).toBe(0);
  });
});

describe("pricePerSqft", () => {
  it("divides price by floor area", () => {
    expect(pricePerSqft(500_000, 1_000)).toBe(500);
  });

  it("returns null for missing or zero floor area — never invents a size", () => {
    expect(pricePerSqft(500_000, 0)).toBeNull();
    expect(pricePerSqft(500_000, null)).toBeNull();
  });
});

describe("priceDropPct", () => {
  it("computes the fractional reduction", () => {
    expect(priceDropPct(500_000, 450_000)).toBeCloseTo(0.1, 5);
  });

  it("returns null when there is no genuine reduction", () => {
    expect(priceDropPct(450_000, 450_000)).toBeNull();
    expect(priceDropPct(450_000, 500_000)).toBeNull();
    expect(priceDropPct(0, 0)).toBeNull();
  });
});

describe("freshnessScore", () => {
  it("decays with age and is highest for today", () => {
    const today = freshnessScore("2026-07-03T00:00:00Z", NOW);
    const lastMonth = freshnessScore("2026-06-03T00:00:00Z", NOW);
    expect(today).toBeGreaterThan(lastMonth);
    expect(today).toBeLessThanOrEqual(1);
    expect(lastMonth).toBeGreaterThan(0);
  });

  it("is zero when the listed date is unknown", () => {
    expect(freshnessScore(null, NOW)).toBe(0);
  });
});

describe("dataQualityScore", () => {
  it("is 1 for a complete candidate and lower when fields are missing", () => {
    expect(dataQualityScore(makeCandidate())).toBe(1);
    const sparse = dataQualityScore(
      makeCandidate({
        imageUrl: null,
        bedrooms: null,
        bathrooms: null,
        squareFootage: null,
        listedDate: null,
      }),
    );
    expect(sparse).toBeGreaterThan(0);
    expect(sparse).toBeLessThan(1);
  });
});

describe("rankCandidates", () => {
  it("value list only admits homes below the benchmark with a meaningful confidence", () => {
    const below = makeCandidate({
      benchmark: { median: 600_000, deltaPct: -0.12, confidence: "High", areaName: "Southwark" },
    });
    const barelyBelow = makeCandidate({
      benchmark: { median: 505_000, deltaPct: -0.01, confidence: "High", areaName: "Southwark" },
    });
    const above = makeCandidate({
      benchmark: { median: 400_000, deltaPct: 0.25, confidence: "High", areaName: "Lambeth" },
    });
    const noConfidence = makeCandidate({
      benchmark: { median: 600_000, deltaPct: -0.2, confidence: "Insufficient", areaName: null },
    });
    const noBenchmark = makeCandidate({ benchmark: null });

    const ranked = rankCandidates(
      category("below-local-benchmark"),
      [above, barelyBelow, below, noConfidence, noBenchmark],
      { now: NOW },
    );

    expect(ranked.map((r) => r.listingId)).toEqual([below.listingId]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].reason).toContain("12% below local benchmark");
    expect(ranked[0].reason).toContain("High confidence");
  });

  it("orders price-per-square-foot ascending and excludes homes without a floor area", () => {
    const cheap = makeCandidate({ price: 300_000, squareFootage: 1_500 });
    const dear = makeCandidate({ price: 900_000, squareFootage: 900 });
    const noArea = makeCandidate({ squareFootage: null });

    const ranked = rankCandidates(
      category("best-price-per-square-foot"),
      [dear, noArea, cheap],
      { now: NOW },
    );
    expect(ranked.map((r) => r.listingId)).toEqual([cheap.listingId, dear.listingId]);
    expect(ranked[0].reason).toContain("£200 per sq ft");
  });

  it("interest list requires real engagement and ranks by the blended score", () => {
    const hot = makeCandidate({ viewCount: 200, favoriteCount: 30, enquiryCount: 10 });
    const warm = makeCandidate({ viewCount: 20, favoriteCount: 1, enquiryCount: 0 });
    const cold = makeCandidate({ viewCount: 0, favoriteCount: 0, enquiryCount: 0 });

    const ranked = rankCandidates(
      category("strongest-buyer-interest"),
      [warm, cold, hot],
      { now: NOW },
    );
    expect(ranked.map((r) => r.listingId)).toEqual([hot.listingId, warm.listingId]);
    expect(ranked[0].reason).toContain("200 views");
    expect(ranked[0].reason).toContain("30 saves");
  });

  it("newest list orders by listed date descending and excludes unknown dates", () => {
    const june = makeCandidate({ listedDate: "2026-06-01T00:00:00Z" });
    const july = makeCandidate({ listedDate: "2026-07-01T00:00:00Z" });
    const unknown = makeCandidate({ listedDate: null });

    const ranked = rankCandidates(
      category("newly-listed-homes"),
      [june, unknown, july],
      { now: NOW },
    );
    expect(ranked.map((r) => r.listingId)).toEqual([july.listingId, june.listingId]);
  });

  it("price-drop list only ever contains genuine reductions", () => {
    const dropped = makeCandidate({
      priceDrop: { oldPrice: 800_000, newPrice: 680_000 },
    });
    const unchanged = makeCandidate({ priceDrop: null });
    const increased = makeCandidate({
      priceDrop: { oldPrice: 500_000, newPrice: 550_000 },
    });

    const ranked = rankCandidates(
      category("biggest-price-drops"),
      [unchanged, dropped, increased],
      { now: NOW },
    );
    expect(ranked.map((r) => r.listingId)).toEqual([dropped.listingId]);
    expect(ranked[0].reason).toContain("15%");
  });

  it("city list only contains homes in that city", () => {
    const london = makeCandidate({ city: "London" });
    const leeds = makeCandidate({ city: "Leeds" });

    const ranked = rankCandidates(
      category("top-homes-in-london"),
      [leeds, london],
      { now: NOW },
    );
    expect(ranked.map((r) => r.listingId)).toEqual([london.listingId]);
  });

  it("never ranks rentals or homes without a positive price", () => {
    const rental = makeCandidate({ listingType: "rent" });
    const freebie = makeCandidate({ price: 0 });
    const sale = makeCandidate();

    const ranked = rankCandidates(
      category("most-expensive-homes"),
      [rental, freebie, sale],
      { now: NOW },
    );
    expect(ranked.map((r) => r.listingId)).toEqual([sale.listingId]);
  });

  it("respects the limit option and assigns sequential ranks", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ price: 100_000 * (i + 1) }),
    );
    const ranked = rankCandidates(category("most-expensive-homes"), candidates, {
      now: NOW,
      limit: 4,
    });
    expect(ranked).toHaveLength(4);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(ranked[0].price).toBe(1_000_000);
  });
});
