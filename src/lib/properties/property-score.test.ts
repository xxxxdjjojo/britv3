import { describe, it, expect } from "vitest";
import {
  buildBuyerScore,
  buildRenterScore,
  type ScoreInputs,
} from "./property-score";

const FULL: ScoreInputs = {
  epcRating: "B",
  valueDeltaPct: -0.08,
  floodBand: "Very Low",
  transitScore: 85,
  walkScore: 72,
  transportStopCount: 6,
  schoolRating: "Outstanding",
};

describe("buildBuyerScore", () => {
  it("bands every dimension from real signals", () => {
    const s = buildBuyerScore(FULL);
    const byKey = Object.fromEntries(s.dimensions.map((d) => [d.key, d.stars]));
    expect(byKey.energy).toBe(5); // EPC B
    expect(byKey.value).toBe(4); // 8% below median
    expect(byKey.commuting).toBe(5); // transit 85
    expect(byKey.lifestyle).toBe(4); // walk 72
    expect(byKey.schools).toBe(5); // Outstanding
    expect(byKey.risk).toBe(5); // Very Low flood
  });

  it("carries a basis string for every dimension", () => {
    for (const d of buildBuyerScore(FULL).dimensions) {
      expect(d.basis.length).toBeGreaterThan(0);
    }
  });

  it("computes overall as the mean of dimensions scaled to /100", () => {
    // stars 4,5,5,4,5,5 = 28 / 30 → 93
    expect(buildBuyerScore(FULL).overall).toBe(93);
  });

  it("self-gates: omits dimensions whose signal is null and excludes them from the mean", () => {
    const s = buildBuyerScore({ epcRating: "A" });
    expect(s.dimensions).toHaveLength(1);
    expect(s.dimensions[0].key).toBe("energy");
    expect(s.overall).toBe(100); // single 5★ dimension
  });

  it("returns overall 0 with no signals", () => {
    expect(buildBuyerScore({}).overall).toBe(0);
    expect(buildBuyerScore({}).dimensions).toHaveLength(0);
  });
});

describe("buildRenterScore", () => {
  it("uses connectivity (transport stops) in place of buy-only dimensions", () => {
    const s = buildRenterScore(FULL);
    const keys = s.dimensions.map((d) => d.key);
    expect(keys).toContain("connectivity");
    expect(keys).not.toContain("schools");
    const conn = s.dimensions.find((d) => d.key === "connectivity");
    expect(conn?.stars).toBe(4); // 6 stops
  });
});

describe("banding edges", () => {
  it("bands EPC C/D/F correctly", () => {
    expect(buildBuyerScore({ epcRating: "C" }).dimensions[0].stars).toBe(4);
    expect(buildBuyerScore({ epcRating: "D" }).dimensions[0].stars).toBe(3);
    expect(buildBuyerScore({ epcRating: "F" }).dimensions[0].stars).toBe(1);
  });

  it("bands high flood risk as 1★", () => {
    expect(buildBuyerScore({ floodBand: "High" }).dimensions[0].stars).toBe(1);
  });

  it("ignores an unrecognised EPC value", () => {
    expect(buildBuyerScore({ epcRating: "Z" }).dimensions).toHaveLength(0);
  });
});
