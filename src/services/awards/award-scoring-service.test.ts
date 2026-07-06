import { describe, expect, it } from "vitest";

import {
  AWARD_METRICS,
  AWARD_MIN_SAMPLE,
  STALE_LISTING_DAYS,
  buildAgencyAwardStanding,
  buildListingHygieneScores,
  buildPricingAccuracyScores,
  buildTimeToSellScores,
  type AwardScoreRow,
  type ListingHygieneInput,
  type PricingPairInput,
  type TimeToSellInput,
} from "./award-scoring-service";

function pricingPairs(agencyId: string, n: number, gapPct: number): PricingPairInput[] {
  // soldPounds 100000, asking offset by gapPct exactly.
  return Array.from({ length: n }, () => ({
    agencyId,
    askingPounds: 100_000 * (1 + gapPct / 100),
    soldPounds: 100_000,
  }));
}

function timeToSellObs(agencyId: string, n: number, days: number): TimeToSellInput[] {
  return Array.from({ length: n }, () => ({ agencyId, daysToSell: days }));
}

function hygieneListings(
  agencyId: string,
  counts: { active?: number; stale?: number; withdrawn?: number },
): ListingHygieneInput[] {
  return [
    ...Array.from({ length: counts.active ?? 0 }, () => ({
      agencyId,
      status: "active",
      daysSinceListed: 30,
    })),
    ...Array.from({ length: counts.stale ?? 0 }, () => ({
      agencyId,
      status: "active",
      daysSinceListed: STALE_LISTING_DAYS + 1,
    })),
    ...Array.from({ length: counts.withdrawn ?? 0 }, () => ({
      agencyId,
      status: "withdrawn",
      daysSinceListed: 90,
    })),
  ];
}

describe("buildPricingAccuracyScores", () => {
  it("returns empty output for empty input", () => {
    expect(buildPricingAccuracyScores([])).toEqual([]);
  });

  it("computes the median absolute gap % per agency", () => {
    const scores = buildPricingAccuracyScores(pricingPairs("a", AWARD_MIN_SAMPLE, 4));
    expect(scores).toHaveLength(1);
    expect(scores[0].value).toBe(4);
    expect(scores[0].sampleN).toBe(AWARD_MIN_SAMPLE);
    expect(scores[0].eligible).toBe(true);
    expect(scores[0].exclusionReason).toBeNull();
    expect(scores[0].rank).toBe(1);
  });

  it("treats under-asking sales as an absolute gap (never negative)", () => {
    const scores = buildPricingAccuracyScores(pricingPairs("a", AWARD_MIN_SAMPLE, -10));
    expect(scores[0].value).toBe(10);
  });

  it("excludes at exactly one below the threshold, includes at the threshold", () => {
    const below = buildPricingAccuracyScores(pricingPairs("a", AWARD_MIN_SAMPLE - 1, 2));
    expect(below[0].eligible).toBe(false);
    expect(below[0].exclusionReason).toBe("insufficient_sample");
    expect(below[0].rank).toBeNull();
    // Computed-and-suppressed: the value is still present so the agency can see it.
    expect(below[0].value).toBe(2);

    const at = buildPricingAccuracyScores(pricingPairs("b", AWARD_MIN_SAMPLE, 2));
    expect(at[0].eligible).toBe(true);
    expect(at[0].rank).toBe(1);
  });

  it("drops invalid pairs before counting the sample", () => {
    const junk: PricingPairInput[] = [
      { agencyId: "a", askingPounds: 0, soldPounds: 100_000 },
      { agencyId: "a", askingPounds: 100_000, soldPounds: -5 },
      { agencyId: "a", askingPounds: Number.NaN, soldPounds: 100_000 },
    ];
    const scores = buildPricingAccuracyScores([
      ...junk,
      ...pricingPairs("a", AWARD_MIN_SAMPLE - 1, 3),
    ]);
    expect(scores[0].sampleN).toBe(AWARD_MIN_SAMPLE - 1);
    expect(scores[0].eligible).toBe(false);
  });

  it("ranks eligible agencies ascending by gap and lists excluded agencies unranked", () => {
    const scores = buildPricingAccuracyScores([
      ...pricingPairs("sloppy", AWARD_MIN_SAMPLE, 9),
      ...pricingPairs("sharp", AWARD_MIN_SAMPLE, 1),
      ...pricingPairs("thin", 1, 0),
    ]);
    expect(scores.map((s) => s.agencyId)).toEqual(["sharp", "sloppy", "thin"]);
    expect(scores.map((s) => s.rank)).toEqual([1, 2, null]);
  });

  it("breaks value ties deterministically by agencyId", () => {
    const scores = buildPricingAccuracyScores([
      ...pricingPairs("beta", AWARD_MIN_SAMPLE, 3),
      ...pricingPairs("alpha", AWARD_MIN_SAMPLE, 3),
    ]);
    expect(scores.map((s) => s.agencyId)).toEqual(["alpha", "beta"]);
  });
});

describe("buildTimeToSellScores", () => {
  it("returns empty output for empty input", () => {
    expect(buildTimeToSellScores([], 100)).toEqual([]);
  });

  it("scores days relative to the local median (negative = faster)", () => {
    const scores = buildTimeToSellScores(timeToSellObs("a", AWARD_MIN_SAMPLE, 80), 100);
    expect(scores[0].value).toBe(-20);
    expect(scores[0].eligible).toBe(true);
    expect(scores[0].rank).toBe(1);
  });

  it("excludes everyone with no_baseline when the local median is unpublished", () => {
    const scores = buildTimeToSellScores(timeToSellObs("a", AWARD_MIN_SAMPLE, 80), null);
    expect(scores[0].eligible).toBe(false);
    expect(scores[0].exclusionReason).toBe("no_baseline");
    expect(scores[0].value).toBeNull();
    expect(scores[0].rank).toBeNull();
  });

  it("insufficient_sample takes precedence over no_baseline", () => {
    const scores = buildTimeToSellScores(timeToSellObs("a", AWARD_MIN_SAMPLE - 1, 80), null);
    expect(scores[0].exclusionReason).toBe("insufficient_sample");
  });

  it("suppresses below the disclosed threshold even with a baseline", () => {
    const scores = buildTimeToSellScores(timeToSellObs("a", AWARD_MIN_SAMPLE - 1, 80), 100);
    expect(scores[0].eligible).toBe(false);
    expect(scores[0].exclusionReason).toBe("insufficient_sample");
  });
});

describe("buildListingHygieneScores", () => {
  it("returns empty output for empty input", () => {
    expect(buildListingHygieneScores([])).toEqual([]);
  });

  it("computes the withdrawn + stale share", () => {
    const scores = buildListingHygieneScores(
      hygieneListings("a", { active: 6, stale: 2, withdrawn: 2 }),
    );
    expect(scores[0].value).toBe(40);
    expect(scores[0].sampleN).toBe(10);
    expect(scores[0].eligible).toBe(true);
  });

  it("a listing at exactly STALE_LISTING_DAYS is not stale; one day over is", () => {
    const atBoundary: ListingHygieneInput[] = Array.from(
      { length: AWARD_MIN_SAMPLE },
      () => ({ agencyId: "a", status: "active", daysSinceListed: STALE_LISTING_DAYS }),
    );
    expect(buildListingHygieneScores(atBoundary)[0].value).toBe(0);

    const over: ListingHygieneInput[] = Array.from({ length: AWARD_MIN_SAMPLE }, () => ({
      agencyId: "a",
      status: "active",
      daysSinceListed: STALE_LISTING_DAYS + 1,
    }));
    expect(buildListingHygieneScores(over)[0].value).toBe(100);
  });

  it("suppresses agencies with fewer listings than the threshold", () => {
    const scores = buildListingHygieneScores(
      hygieneListings("a", { active: AWARD_MIN_SAMPLE - 1 }),
    );
    expect(scores[0].eligible).toBe(false);
    expect(scores[0].exclusionReason).toBe("insufficient_sample");
  });

  it("ranks cleanest books first", () => {
    const scores = buildListingHygieneScores([
      ...hygieneListings("messy", { active: 2, withdrawn: 3 }),
      ...hygieneListings("clean", { active: 5 }),
    ]);
    expect(scores.map((s) => s.agencyId)).toEqual(["clean", "messy"]);
    expect(scores.map((s) => s.rank)).toEqual([1, 2]);
  });
});

describe("buildAgencyAwardStanding", () => {
  const row = (overrides: Partial<AwardScoreRow>): AwardScoreRow => ({
    agency_id: "org-1",
    period: "2026",
    metric: "pricing_accuracy",
    value: 3.2,
    sample_n: 8,
    eligibility_flag: true,
    computed_at: "2026-07-03T00:00:00Z",
    ...overrides,
  });

  it("always returns one standing per metric, even with no rows", () => {
    const standing = buildAgencyAwardStanding([]);
    expect(standing.period).toBeNull();
    expect(standing.metrics.map((m) => m.metric)).toEqual([...AWARD_METRICS]);
    for (const metric of standing.metrics) {
      expect(metric.eligible).toBe(false);
      expect(metric.exclusionReason).toBe("insufficient_sample");
      expect(metric.value).toBeNull();
    }
  });

  it("maps eligible rows through with numeric coercion", () => {
    const standing = buildAgencyAwardStanding([row({ value: "3.20" as unknown as number })]);
    const pricing = standing.metrics.find((m) => m.metric === "pricing_accuracy");
    expect(pricing?.value).toBe(3.2);
    expect(pricing?.eligible).toBe(true);
    expect(pricing?.exclusionReason).toBeNull();
  });

  it("explains suppressed rows: small sample → insufficient_sample", () => {
    const standing = buildAgencyAwardStanding([
      row({ sample_n: AWARD_MIN_SAMPLE - 1, eligibility_flag: false, value: 2 }),
    ]);
    const pricing = standing.metrics.find((m) => m.metric === "pricing_accuracy");
    expect(pricing?.eligible).toBe(false);
    expect(pricing?.exclusionReason).toBe("insufficient_sample");
    expect(pricing?.sampleN).toBe(AWARD_MIN_SAMPLE - 1);
  });

  it("explains suppressed rows: enough sample but no baseline → no_baseline", () => {
    const standing = buildAgencyAwardStanding([
      row({
        metric: "time_to_sell",
        sample_n: AWARD_MIN_SAMPLE + 2,
        eligibility_flag: false,
        value: null,
      }),
    ]);
    const tts = standing.metrics.find((m) => m.metric === "time_to_sell");
    expect(tts?.exclusionReason).toBe("no_baseline");
  });

  it("uses only the latest period when several exist", () => {
    const standing = buildAgencyAwardStanding([
      row({ period: "2025", value: 9 }),
      row({ period: "2026", value: 2 }),
    ]);
    expect(standing.period).toBe("2026");
    const pricing = standing.metrics.find((m) => m.metric === "pricing_accuracy");
    expect(pricing?.value).toBe(2);
  });
});
