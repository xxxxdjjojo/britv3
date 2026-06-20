import { describe, it, expect } from "vitest";
import { levelLabel, bandSubtitle, locationHeadline } from "./copy";

describe("levelLabel", () => {
  it("maps each ladder level to an honest, non-street label", () => {
    expect(levelLabel("lsoa")).toBe("this neighbourhood");
    expect(levelLabel("postcode_district")).toBe("this postcode district");
    expect(levelLabel("msoa")).toBe("this area");
    expect(levelLabel("local_authority")).toBe("this local authority");
  });

  it("never claims a specific street", () => {
    for (const level of ["lsoa", "postcode_district", "msoa", "local_authority", null]) {
      expect(levelLabel(level).toLowerCase()).not.toContain("street");
    }
  });

  it("falls back to 'this area' for unknown/null levels", () => {
    expect(levelLabel(null)).toBe("this area");
    expect(levelLabel("galaxy")).toBe("this area");
  });
});

describe("bandSubtitle", () => {
  const base = {
    median: 210000,
    p10: 125000,
    p90: 332750,
    latestDate: "2026-02-27",
    confidence: "High" as const,
  };

  it("names the count + level for a sufficient band", () => {
    expect(
      bandSubtitle({
        ...base,
        count: 42,
        insufficient: false,
        levelUsed: "postcode_district",
        areaName: "M1",
      }),
    ).toBe("Based on 42 sales in this postcode district over the last 12 months");
  });

  it("uses the singular for a single sale", () => {
    expect(
      bandSubtitle({
        ...base,
        count: 1,
        insufficient: false,
        levelUsed: "lsoa",
        areaName: "X",
      }),
    ).toBe("Based on 1 sale in this neighbourhood over the last 12 months");
  });

  it("returns null for an insufficient band (never implies a count)", () => {
    expect(
      bandSubtitle({
        ...base,
        median: null,
        count: 0,
        insufficient: true,
        levelUsed: null,
        areaName: null,
      }),
    ).toBeNull();
  });
});

describe("locationHeadline", () => {
  it("combines postcode + town", () => {
    expect(
      locationHeadline({
        postcodeDisplay: "M1 1AE",
        ladName: "Manchester",
        region: "North West",
        lat: 0,
        lng: 0,
      }),
    ).toBe("M1 1AE · Manchester");
  });

  it("falls back to region, then to a bare postcode", () => {
    expect(
      locationHeadline({
        postcodeDisplay: "M1 1AE",
        ladName: null,
        region: "North West",
        lat: 0,
        lng: 0,
      }),
    ).toBe("M1 1AE · North West");
    expect(
      locationHeadline({
        postcodeDisplay: "M1 1AE",
        ladName: null,
        region: null,
        lat: 0,
        lng: 0,
      }),
    ).toBe("M1 1AE");
  });

  it("is empty for a null location", () => {
    expect(locationHeadline(null)).toBe("");
  });
});
