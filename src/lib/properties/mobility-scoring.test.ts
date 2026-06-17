import { describe, it, expect } from "vitest";
import {
  haversineMeters,
  distanceDecay,
  scoreLabel,
  computeWalkScore,
  computeTransitScore,
  computeBikeScore,
  type WalkAmenity,
  type TransitStop,
} from "./mobility-scoring";

describe("haversineMeters", () => {
  it("is ~0 for the same point", () => {
    expect(haversineMeters(51.5, -0.1, 51.5, -0.1)).toBeLessThan(1);
  });

  it("matches a known distance (~111 km per degree of latitude)", () => {
    const d = haversineMeters(51.0, 0, 52.0, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("distanceDecay", () => {
  it("is 1 at the point and 0.5 at the half-life", () => {
    expect(distanceDecay(0, 800)).toBe(1);
    expect(distanceDecay(800, 800)).toBeCloseTo(0.5, 5);
  });

  it("decreases monotonically with distance", () => {
    expect(distanceDecay(400, 800)).toBeGreaterThan(distanceDecay(1200, 800));
  });
});

describe("scoreLabel", () => {
  it("maps score bands to labels", () => {
    expect(scoreLabel(95)).toBe("Excellent");
    expect(scoreLabel(60)).toBe("Good");
    expect(scoreLabel(40)).toBe("Moderate");
    expect(scoreLabel(20)).toBe("Limited");
    expect(scoreLabel(0)).toBe("Minimal");
  });
});

describe("computeWalkScore", () => {
  it("is 0 with no amenities", () => {
    expect(computeWalkScore([])).toBe(0);
  });

  it("rewards closer amenities over distant ones", () => {
    const close: WalkAmenity[] = [{ category: "grocery", distanceMeters: 100 }];
    const far: WalkAmenity[] = [{ category: "grocery", distanceMeters: 2000 }];
    expect(computeWalkScore(close)).toBeGreaterThan(computeWalkScore(far));
  });

  it("rewards a diverse mix of categories and stays within 0-100", () => {
    const diverse: WalkAmenity[] = [
      { category: "grocery", distanceMeters: 150 },
      { category: "food", distanceMeters: 200 },
      { category: "school", distanceMeters: 300 },
      { category: "health", distanceMeters: 250 },
      { category: "park", distanceMeters: 180 },
      { category: "retail", distanceMeters: 120 },
    ];
    const score = computeWalkScore(diverse);
    expect(score).toBeGreaterThan(computeWalkScore([{ category: "grocery", distanceMeters: 150 }]));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("saturates per category (10 groceries are not 10x one)", () => {
    const one: WalkAmenity[] = [{ category: "grocery", distanceMeters: 100 }];
    const many: WalkAmenity[] = Array.from({ length: 10 }, () => ({
      category: "grocery" as const,
      distanceMeters: 100,
    }));
    expect(computeWalkScore(many)).toBeLessThan(computeWalkScore(one) * 3);
  });
});

describe("computeTransitScore", () => {
  it("is 0 with no stops", () => {
    expect(computeTransitScore([])).toBe(0);
  });

  it("weights rail/tube above bus", () => {
    const rail: TransitStop[] = [{ mode: "rail", distanceMeters: 300 }];
    const bus: TransitStop[] = [{ mode: "bus", distanceMeters: 300 }];
    expect(computeTransitScore(rail)).toBeGreaterThan(computeTransitScore(bus));
  });

  it("scores a dense rail+tube interchange as excellent (near 100)", () => {
    const score = computeTransitScore([
      { mode: "rail", distanceMeters: 150 },
      { mode: "tube", distanceMeters: 120 },
      { mode: "bus", distanceMeters: 80 },
      { mode: "tram", distanceMeters: 200 },
    ]);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("computeBikeScore", () => {
  it("is 0 with no infrastructure", () => {
    expect(computeBikeScore({ cyclewayCount: 0, bikeParkingCount: 0, amenityCount: 0 })).toBe(0);
  });

  it("rises with cycle infrastructure and saturates at 100", () => {
    const low = computeBikeScore({ cyclewayCount: 1, bikeParkingCount: 0, amenityCount: 2 });
    const high = computeBikeScore({ cyclewayCount: 20, bikeParkingCount: 10, amenityCount: 40 });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(100);
  });
});
