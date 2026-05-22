// src/__tests__/lib/seo/postcode-service-matrix.test.ts
//
// MEMO PIVOT v2 — programmatic SEO matrix builder for postcode × service pages.

import { describe, it, expect } from "vitest";

import {
  buildPostcodeServiceMatrix,
  MATRIX_HARD_CAP,
  TOP_SERVICES,
  type PostcodeServicePair,
} from "@/lib/seo/postcode-service-matrix";

const FIXTURE_POSTCODES: ReadonlyArray<string> = [
  "SW1A",
  "EC1N",
  "M1",
  "B1",
  "LS1",
];

describe("buildPostcodeServiceMatrix", () => {
  it("returns a cartesian product of (postcode, service) pairs", () => {
    const matrix = buildPostcodeServiceMatrix({
      postcodeAreas: FIXTURE_POSTCODES,
      services: ["plumber", "electrician", "roofer"],
    });
    expect(matrix.length).toBe(FIXTURE_POSTCODES.length * 3);
  });

  it("caps the matrix size at MATRIX_HARD_CAP", () => {
    const lots: string[] = [];
    for (let i = 0; i < 50_000; i++) {
      lots.push(`PC${i}`);
    }
    const matrix = buildPostcodeServiceMatrix({
      postcodeAreas: lots,
      services: TOP_SERVICES,
    });
    expect(matrix.length).toBeLessThanOrEqual(MATRIX_HARD_CAP);
  });

  it("produces a slug per pair: services-<service>-<postcode>", () => {
    const matrix = buildPostcodeServiceMatrix({
      postcodeAreas: ["SW1A"],
      services: ["plumber"],
    });
    expect(matrix[0]?.slug).toBe("services-plumber-sw1a");
  });

  it("normalises postcodes to upper-case in the rendered slug", () => {
    const matrix = buildPostcodeServiceMatrix({
      postcodeAreas: ["sw1a"],
      services: ["plumber"],
    });
    expect(matrix[0]?.postcode).toBe("SW1A");
    expect(matrix[0]?.slug).toContain("sw1a"); // slugs are lowercase
  });

  it("does not produce duplicate pairs", () => {
    const matrix = buildPostcodeServiceMatrix({
      postcodeAreas: ["SW1A", "SW1A"],
      services: ["plumber", "plumber"],
    });
    const slugs = new Set<string>(matrix.map((m: PostcodeServicePair) => m.slug));
    expect(slugs.size).toBe(matrix.length);
  });
});

describe("TOP_SERVICES", () => {
  it("includes at least 8 distinct service categories the memo cares about", () => {
    expect(TOP_SERVICES.length).toBeGreaterThanOrEqual(8);
    for (const expected of ["plumber", "electrician", "surveyor", "conveyancer"]) {
      expect(TOP_SERVICES).toContain(expected);
    }
  });
});
