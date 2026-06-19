import { describe, it, expect } from "vitest";
import {
  GEOGRAPHY_LEVELS,
  geographyLevelForZoom,
} from "./geography";
import type { GeographyLevel } from "./geography";

// ---------------------------------------------------------------------------
// GEOGRAPHY_LEVELS constant
// ---------------------------------------------------------------------------

describe("GEOGRAPHY_LEVELS", () => {
  it("is ordered coarse to fine", () => {
    expect(GEOGRAPHY_LEVELS).toEqual([
      "local_authority",
      "postcode_district",
      "msoa",
      "lsoa",
      "street",
    ]);
  });

  it("has exactly 5 levels", () => {
    expect(GEOGRAPHY_LEVELS).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// geographyLevelForZoom
// ---------------------------------------------------------------------------

describe("geographyLevelForZoom", () => {
  // Below-minimum: zoom < 4 should clamp to local_authority
  it("zoom=0 (below minimum) → local_authority", () => {
    expect(geographyLevelForZoom(0)).toBe<GeographyLevel>("local_authority");
  });

  it("zoom=3 (below band start) → local_authority", () => {
    expect(geographyLevelForZoom(3)).toBe<GeographyLevel>("local_authority");
  });

  // Band: zoom < 7 → local_authority
  it("zoom=4 → local_authority", () => {
    expect(geographyLevelForZoom(4)).toBe<GeographyLevel>("local_authority");
  });

  it("zoom=6 → local_authority", () => {
    expect(geographyLevelForZoom(6)).toBe<GeographyLevel>("local_authority");
  });

  it("zoom=6.9 (fractional, just below 7) → local_authority", () => {
    expect(geographyLevelForZoom(6.9)).toBe<GeographyLevel>("local_authority");
  });

  // Band: 7 ≤ zoom < 10 → postcode_district
  it("zoom=7 (band boundary) → postcode_district", () => {
    expect(geographyLevelForZoom(7)).toBe<GeographyLevel>("postcode_district");
  });

  it("zoom=9 → postcode_district", () => {
    expect(geographyLevelForZoom(9)).toBe<GeographyLevel>("postcode_district");
  });

  it("zoom=9.99 (fractional, just below 10) → postcode_district", () => {
    expect(geographyLevelForZoom(9.99)).toBe<GeographyLevel>("postcode_district");
  });

  // Band: 10 ≤ zoom < 13 → msoa
  it("zoom=10 (band boundary) → msoa", () => {
    expect(geographyLevelForZoom(10)).toBe<GeographyLevel>("msoa");
  });

  it("zoom=12 → msoa", () => {
    expect(geographyLevelForZoom(12)).toBe<GeographyLevel>("msoa");
  });

  it("zoom=12.9 (fractional, just below 13) → msoa", () => {
    expect(geographyLevelForZoom(12.9)).toBe<GeographyLevel>("msoa");
  });

  // Band: 13 ≤ zoom < 16 → lsoa
  it("zoom=13 (band boundary) → lsoa", () => {
    expect(geographyLevelForZoom(13)).toBe<GeographyLevel>("lsoa");
  });

  it("zoom=15 → lsoa", () => {
    expect(geographyLevelForZoom(15)).toBe<GeographyLevel>("lsoa");
  });

  it("zoom=15.99 (fractional, just below 16) → lsoa", () => {
    expect(geographyLevelForZoom(15.99)).toBe<GeographyLevel>("lsoa");
  });

  // Band: zoom ≥ 16 → lsoa (finest level with data).
  //
  // The "street" / micro-area regime is deliberately NOT returned: the street
  // service returns 0 features and the vector tiles cap geometry at LSOA, so
  // resolving "street" at high zoom blanked the choropleth (no colour, empty
  // area list, "NO DATA" legend) and broke hover lookups (H3 ids vs LSOA ids).
  // Capping at lsoa keeps the finest real data visible; MapLibre overzooms the
  // z16 LSOA tile beyond zoom 16 so colour persists as the user zooms further.
  it("zoom=16 (band boundary) → lsoa (street regime has no data)", () => {
    expect(geographyLevelForZoom(16)).toBe<GeographyLevel>("lsoa");
  });

  it("zoom=20 (very deep) → lsoa", () => {
    expect(geographyLevelForZoom(20)).toBe<GeographyLevel>("lsoa");
  });

  it("never returns 'street' at any zoom (dead regime)", () => {
    for (let z = -2; z <= 24; z += 0.5) {
      expect(geographyLevelForZoom(z)).not.toBe("street");
    }
  });

  // Negative zoom: clamp to local_authority
  it("zoom=-1 (negative) → local_authority", () => {
    expect(geographyLevelForZoom(-1)).toBe<GeographyLevel>("local_authority");
  });
});
