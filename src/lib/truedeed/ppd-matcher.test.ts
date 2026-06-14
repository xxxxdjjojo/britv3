/**
 * Tests for truedeed/ppd-matcher (TDD RED — module not yet implemented)
 *
 * Pins the contract of @/lib/truedeed/ppd-matcher per
 * docs/truedeed/attribution-tracking-spec.md §4.3 (score table) and §4.4.
 * All functions are PURE — no I/O, no Date.now().
 *
 * Score components (weights pinned from the spec table):
 *   - Postcode gate: normalised inequality OR either side null → null
 *   - PAON exact (normalised / range-expanded)        +0.35
 *   - else PAON trigram >= 0.7                        +0.20
 *   - SAON both present and equal (normalised)        +0.10
 *       flats (propertyType 'F') with SAON missing on either side
 *       → total CAPPED at 0.6
 *   - Street trigram >= 0.5                           +0.10
 *   - Date plausibility (max)                         +0.15
 *       full within [occurredAt + 6 weeks, tailExpiresAt + 3 months],
 *       linear decay to 0 over 3 months outside either bound
 *   - Price within ±12.5% of asking                   +0.10
 *       (skipped entirely when askingPricePence is null)
 *   - ppdCategory 'B' → total CAPPED at 0.7 (after summing);
 *     when both caps apply the minimum cap (0.6) wins.
 */

import { describe, it, expect } from "vitest";

import {
  scoreMatch,
  normalisePostcode,
  normalisePaon,
  paonsEqual,
  trigramSimilarity,
  VERIFICATION_AUTO_CONFIRM,
  AUDIT_QUERY,
  WATCHLIST,
  type PpdRow,
  type ListingForMatch,
} from "@/lib/truedeed/ppd-matcher";

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

/** Shift a "YYYY-MM-DD" date by whole days (UTC), returning "YYYY-MM-DD". */
const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Introduction: occurred 2026-01-01, tail expires 2026-07-01 (6-month tail).
// Date-plausibility window lower bound = occurredAt + 6 weeks = 2026-02-12.
const OCCURRED_AT = "2026-01-01T00:00:00.000Z";
const TAIL_EXPIRES_AT = "2026-07-01T00:00:00.000Z";
const LOWER_BOUND = "2026-02-12"; // 2026-01-01 + 42 days
const UPPER_BOUND = "2026-10-01"; // tailExpiresAt + 3 months
const IN_WINDOW = "2026-04-15";

const BASE_PPD: PpdRow = {
  ppdTuid: "8A4F1D2E-3B5C-4F6A-9E8D-7C1B2A3F4E5D",
  pricePence: 22000000, // £220,000
  transferDate: IN_WINDOW,
  postcode: "SW1A 1AA",
  propertyType: "T",
  paon: "12",
  saon: null,
  street: "DOWNING STREET",
  ppdCategory: "A",
};

const BASE_LISTING: ListingForMatch = {
  listingId: "listing-1",
  postcode: "SW1A 1AA",
  paon: "12",
  saon: null,
  street: "DOWNING STREET",
  propertyType: "terraced",
  askingPricePence: 22000000, // exactly asking — within ±12.5%
  introduction: {
    introductionId: "intro-1",
    occurredAt: OCCURRED_AT,
    tailExpiresAt: TAIL_EXPIRES_AT,
  },
};

const makePpd = (overrides: Partial<PpdRow> = {}): PpdRow => ({
  ...BASE_PPD,
  ...overrides,
});

const makeListing = (
  overrides: Partial<ListingForMatch> = {},
): ListingForMatch => ({
  ...BASE_LISTING,
  ...overrides,
  introduction: { ...BASE_LISTING.introduction, ...overrides.introduction },
});

// ---------------------------------------------------------------------------
// 1. Thresholds (spec §4.3 — pinned exactly)
// ---------------------------------------------------------------------------

describe("threshold constants", () => {
  it("pins VERIFICATION_AUTO_CONFIRM=0.80, AUDIT_QUERY=0.65, WATCHLIST=0.50", () => {
    expect(VERIFICATION_AUTO_CONFIRM).toBe(0.8);
    expect(AUDIT_QUERY).toBe(0.65);
    expect(WATCHLIST).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// 2. Normalisers
// ---------------------------------------------------------------------------

describe("normalisePostcode", () => {
  it("uppercases and collapses to a single internal space", () => {
    // Arrange + Act + Assert
    expect(normalisePostcode("sw1a  1aa")).toBe("SW1A 1AA");
    expect(normalisePostcode(" Sw1a 1aA ")).toBe("SW1A 1AA");
  });

  it("inserts the space before the 3-character incode when missing", () => {
    expect(normalisePostcode("SW1A1AA")).toBe("SW1A 1AA");
    expect(normalisePostcode("b11bb")).toBe("B1 1BB");
  });
});

describe("normalisePaon", () => {
  it("strips punctuation, collapses spaces and uppercases", () => {
    expect(normalisePaon("St. John's   Cottage")).toBe("ST JOHNS COTTAGE");
    expect(normalisePaon("  flat   2b ")).toBe("FLAT 2B");
  });
});

describe("paonsEqual", () => {
  it("is exact after normalisation", () => {
    expect(paonsEqual("12a", "12A")).toBe(true);
    expect(paonsEqual("Rose Cottage", "ROSE  COTTAGE")).toBe(true);
    expect(paonsEqual("12", "14")).toBe(false);
  });

  it("expands ranges: '12-14' matches '12' and '14'", () => {
    expect(paonsEqual("12-14", "12")).toBe(true);
    expect(paonsEqual("12-14", "14")).toBe(true);
    expect(paonsEqual("12", "12-14")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. trigramSimilarity — classic padded 3-gram Jaccard, 0..1
// ---------------------------------------------------------------------------

describe("trigramSimilarity", () => {
  it("returns 1 for identical strings and 0 for disjoint strings", () => {
    expect(trigramSimilarity("rose cottage", "rose cottage")).toBe(1);
    expect(trigramSimilarity("abc", "xyz")).toBe(0);
  });

  it("scores 'rose cottage' vs 'rose cottage farm' strictly between 0.5 and 1", () => {
    // Act
    const sim = trigramSimilarity("rose cottage", "rose cottage farm");

    // Assert
    expect(sim).toBeGreaterThan(0.5);
    expect(sim).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// 4. scoreMatch — postcode gate
// ---------------------------------------------------------------------------

describe("scoreMatch — postcode gate", () => {
  it("returns null when normalised postcodes differ", () => {
    // Arrange
    const ppd = makePpd({ postcode: "SW1A 2AA" });

    // Act + Assert
    expect(scoreMatch(ppd, makeListing())).toBeNull();
  });

  it("returns null when the PPD postcode is null", () => {
    const ppd = makePpd({ postcode: null });

    expect(scoreMatch(ppd, makeListing())).toBeNull();
  });

  it("matches across case and spacing differences via normalisation", () => {
    // Arrange
    const ppd = makePpd({ postcode: "sw1a 1aa" });
    const listing = makeListing({ postcode: "SW1A1AA" });

    // Act
    const result = scoreMatch(ppd, listing);

    // Assert — gate passed, a scored result comes back
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. scoreMatch — worked examples (spec §4.3 weights, pinned arithmetic)
// ---------------------------------------------------------------------------

describe("scoreMatch — worked examples", () => {
  it("perfect house (no SAON either side): 0.35 + 0.10 street + 0.15 date + 0.10 price = 0.70, uncapped", () => {
    // Act
    const result = scoreMatch(makePpd(), makeListing());

    // Assert
    expect(result).not.toBeNull();
    expect(result!.score).toBeCloseTo(0.7, 9);
    expect(result!.capped).toBe(false);
    // Uncapped: component values sum to the score
    const componentSum = Object.values(result!.components).reduce(
      (acc, v) => acc + v,
      0,
    );
    expect(componentSum).toBeCloseTo(result!.score, 9);
  });

  it("flat with both SAONs matching everything: 0.70 + 0.10 SAON = 0.80, uncapped", () => {
    // Arrange
    const ppd = makePpd({ propertyType: "F", saon: "FLAT 3" });
    const listing = makeListing({ propertyType: "flat", saon: "Flat 3" });

    // Act
    const result = scoreMatch(ppd, listing);

    // Assert
    expect(result!.score).toBeCloseTo(0.8, 9);
    expect(result!.capped).toBe(false);
  });

  it("flat with PPD SAON missing: capped at 0.6 (pre-cap 0.70)", () => {
    // Arrange — SAON gaps in PPD flat addressing are unreliable (spec §4.4)
    const ppd = makePpd({ propertyType: "F", saon: null });
    const listing = makeListing({ propertyType: "flat", saon: "FLAT 3" });

    // Act
    const result = scoreMatch(ppd, listing);

    // Assert
    expect(result!.score).toBeCloseTo(0.6, 9);
    expect(result!.capped).toBe(true);
  });

  it("flat with listing SAON missing/empty: capped at 0.6", () => {
    const ppd = makePpd({ propertyType: "F", saon: "FLAT 3" });
    const listing = makeListing({ propertyType: "flat", saon: "" });

    const result = scoreMatch(ppd, listing);

    expect(result!.score).toBeCloseTo(0.6, 9);
    expect(result!.capped).toBe(true);
  });

  it("category B flat with both SAONs (pre-cap 0.80): capped at 0.70", () => {
    // Arrange
    const ppd = makePpd({ propertyType: "F", saon: "FLAT 3", ppdCategory: "B" });
    const listing = makeListing({ propertyType: "flat", saon: "FLAT 3" });

    // Act
    const result = scoreMatch(ppd, listing);

    // Assert
    expect(result!.score).toBeCloseTo(0.7, 9);
    expect(result!.capped).toBe(true);
  });

  it("category B perfect house (pre-cap 0.70): score 0.70, cap not hit", () => {
    const ppd = makePpd({ ppdCategory: "B" });

    const result = scoreMatch(ppd, makeListing());

    expect(result!.score).toBeCloseTo(0.7, 9);
    expect(result!.capped).toBe(false);
  });

  it("flat-SAON cap (0.6) takes precedence over category-B cap (0.7) — min of caps", () => {
    // Arrange — both caps apply: flat with no SAON on either side AND category B
    const ppd = makePpd({ propertyType: "F", saon: null, ppdCategory: "B" });
    const listing = makeListing({ propertyType: "flat", saon: null });

    // Act
    const result = scoreMatch(ppd, listing);

    // Assert — pre-cap 0.70 → min(0.6, 0.7) = 0.6
    expect(result!.score).toBeCloseTo(0.6, 9);
    expect(result!.capped).toBe(true);
  });

  it("PAON trigram >= 0.7 fallback awards 0.20 instead of 0.35: total 0.55", () => {
    // Arrange — 'ROSE COTTAGE' vs 'ROSE COTTAGE FARM' (not exact, trigram >= 0.7)
    const ppd = makePpd({ paon: "ROSE COTTAGE" });
    const listing = makeListing({ paon: "ROSE COTTAGE FARM" });

    // Act
    const result = scoreMatch(ppd, listing);

    // Assert — 0.20 + 0.10 street + 0.15 date + 0.10 price = 0.55
    expect(result!.score).toBeCloseTo(0.55, 9);
    expect(result!.capped).toBe(false);
  });

  it("range PAON '12-14' matches listing PAON '12' as exact: total 0.70", () => {
    const ppd = makePpd({ paon: "12-14" });

    const result = scoreMatch(ppd, makeListing({ paon: "12" }));

    expect(result!.score).toBeCloseTo(0.7, 9);
  });
});

// ---------------------------------------------------------------------------
// 6. scoreMatch — price component
// ---------------------------------------------------------------------------

describe("scoreMatch — price vs asking", () => {
  it("skips the price component when askingPricePence is null: total 0.60", () => {
    // Arrange
    const listing = makeListing({ askingPricePence: null });

    // Act
    const result = scoreMatch(makePpd(), listing);

    // Assert — 0.35 + 0.10 street + 0.15 date = 0.60
    expect(result!.score).toBeCloseTo(0.6, 9);
  });

  it("awards nothing when price is outside ±12.5% of asking: total 0.60", () => {
    // Arrange — sold at +20% of asking
    const ppd = makePpd({ pricePence: 26400000 }); // asking 22000000

    // Act
    const result = scoreMatch(ppd, makeListing());

    // Assert
    expect(result!.score).toBeCloseTo(0.6, 9);
  });
});

// ---------------------------------------------------------------------------
// 7. scoreMatch — date plausibility (0.15 max, linear decay over 3 months)
// ---------------------------------------------------------------------------

describe("scoreMatch — date plausibility", () => {
  it("awards the full 0.15 exactly at the lower bound (occurredAt + 6 weeks)", () => {
    // Arrange
    const ppd = makePpd({ transferDate: LOWER_BOUND });

    // Act
    const result = scoreMatch(ppd, makeListing());

    // Assert — same as the in-window perfect house
    expect(result!.score).toBeCloseTo(0.7, 9);
  });

  it("awards half (0.075) at 1.5 months (45 days) before the lower bound", () => {
    // Arrange
    const ppd = makePpd({ transferDate: addDays(LOWER_BOUND, -45) });

    // Act
    const result = scoreMatch(ppd, makeListing());

    // Assert — 0.55 + 0.075 = 0.625 (tolerance for month-length convention)
    expect(result!.score).toBeCloseTo(0.625, 2);
  });

  it("awards 0 at >= 3 months before the lower bound: total 0.55", () => {
    // Arrange — 120 days outside, beyond 3 months by any convention
    const ppd = makePpd({ transferDate: addDays(LOWER_BOUND, -120) });

    // Act
    const result = scoreMatch(ppd, makeListing());

    // Assert — 0.35 + 0.10 street + 0.10 price = 0.55
    expect(result!.score).toBeCloseTo(0.55, 9);
  });

  it("decays symmetrically above the upper bound (tailExpiresAt + 3 months): half at 45 days past", () => {
    // Arrange
    const ppd = makePpd({ transferDate: addDays(UPPER_BOUND, 45) });

    // Act
    const result = scoreMatch(ppd, makeListing());

    // Assert
    expect(result!.score).toBeCloseTo(0.625, 2);
  });
});

// ---------------------------------------------------------------------------
// 8. scoreMatch — purity
// ---------------------------------------------------------------------------

describe("scoreMatch — purity", () => {
  it("does not mutate its inputs", () => {
    // Arrange
    const ppd = makePpd();
    const listing = makeListing();
    const ppdBefore = JSON.stringify(ppd);
    const listingBefore = JSON.stringify(listing);

    // Act
    scoreMatch(ppd, listing);

    // Assert
    expect(JSON.stringify(ppd)).toBe(ppdBefore);
    expect(JSON.stringify(listing)).toBe(listingBefore);
  });
});
