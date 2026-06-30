import { describe, expect, it } from "vitest";

import { rankExperts, scoreCandidate, type ExpertCandidate } from "./ranking";

function candidate(overrides: Partial<ExpertCandidate> = {}): ExpertCandidate {
  return {
    providerId: overrides.providerId ?? "p-default",
    placementId: overrides.placementId ?? "pl-default",
    averageRating: 4.5,
    totalReviews: 20,
    responseRate: 80,
    profileCompleteness: 0.8,
    locationMatch: "town",
    categoryMatch: true,
    adminFeatured: false,
    priorityOverride: null,
    budgetRemaining: true,
    ...overrides,
  };
}

describe("scoreCandidate", () => {
  it("scores a strong, well-matched provider higher than a weak one", () => {
    const strong = scoreCandidate(candidate({ averageRating: 4.9, totalReviews: 50, profileCompleteness: 1 }));
    const weak = scoreCandidate(candidate({ averageRating: 2.0, totalReviews: 50, profileCompleteness: 0.3 }));
    expect(strong).toBeGreaterThan(weak);
  });

  it("rewards a closer location match", () => {
    const postcode = scoreCandidate(candidate({ locationMatch: "postcode" }));
    const region = scoreCandidate(candidate({ locationMatch: "region" }));
    expect(postcode).toBeGreaterThan(region);
  });

  it("returns a value between 0 and 1", () => {
    const s = scoreCandidate(candidate());
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe("rankExperts", () => {
  it("does NOT let a poor paid trader outrank a good paid trader", () => {
    const good = candidate({ providerId: "good", averageRating: 4.8, totalReviews: 40 });
    const poor = candidate({ providerId: "poor", averageRating: 2.1, totalReviews: 40 });
    const ranked = rankExperts([poor, good], 5);
    expect(ranked[0]?.providerId).toBe("good");
  });

  it("pins an admin-featured trader to the top even with a lower rating", () => {
    const featured = candidate({ providerId: "featured", averageRating: 3.0, adminFeatured: true });
    const organic = candidate({ providerId: "organic", averageRating: 4.9 });
    const ranked = rankExperts([organic, featured], 5);
    expect(ranked[0]?.providerId).toBe("featured");
  });

  it("respects an admin priority override above score", () => {
    const overridden = candidate({ providerId: "boss", averageRating: 3.5, priorityOverride: 100 });
    const better = candidate({ providerId: "better", averageRating: 4.9, priorityOverride: null });
    const ranked = rankExperts([better, overridden], 5);
    expect(ranked[0]?.providerId).toBe("boss");
  });

  it("excludes candidates that have exhausted their budget", () => {
    const broke = candidate({ providerId: "broke", budgetRemaining: false });
    const ok = candidate({ providerId: "ok" });
    const ranked = rankExperts([broke, ok], 5);
    expect(ranked.map((c) => c.providerId)).toEqual(["ok"]);
  });

  it("limits the result set to the requested number", () => {
    const many = Array.from({ length: 10 }, (_, i) => candidate({ providerId: `p${i}`, placementId: `pl${i}` }));
    expect(rankExperts(many, 3)).toHaveLength(3);
  });

  it("returns a stable order and never mutates the input array", () => {
    const input = [candidate({ providerId: "a" }), candidate({ providerId: "b" })];
    const snapshot = [...input];
    rankExperts(input, 5);
    expect(input).toEqual(snapshot);
  });
});
