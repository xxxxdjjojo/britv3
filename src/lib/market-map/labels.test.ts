import { describe, it, expect } from "vitest";
import {
  LEVEL_LABEL,
  isOnsCode,
  humanizeAreaName,
  areaHref,
} from "./labels";

describe("LEVEL_LABEL", () => {
  it("uses plain-English labels, never raw ONS jargon", () => {
    expect(LEVEL_LABEL.local_authority).toBe("Town / borough");
    expect(LEVEL_LABEL.postcode_district).toBe("Postcode");
    expect(LEVEL_LABEL.msoa).toBe("Neighbourhood");
    expect(LEVEL_LABEL.lsoa).toBe("Local area");
  });

  it("contains no 'MSOA'/'LSOA'/'local_authority' jargon in any label", () => {
    for (const label of Object.values(LEVEL_LABEL)) {
      expect(label).not.toMatch(/MSOA|LSOA|local_authority|district/i);
    }
  });
});

describe("isOnsCode", () => {
  it.each([
    ["E02000244", true], // MSOA
    ["E01001316", true], // LSOA
    ["E09000009", true], // local authority
    ["W06000001", true], // Welsh
    ["HA9", false], // postcode district
    ["W5", false], // postcode district
    ["Harrow", false], // town name
    ["Ealing 001", false], // friendly MSOA name from search
    ["", false],
    [null, false],
    [undefined, false],
  ])("isOnsCode(%s) === %s", (input, expected) => {
    expect(isOnsCode(input as string | null | undefined)).toBe(expected);
  });
});

describe("humanizeAreaName", () => {
  it("keeps a real postcode at postcode_district level", () => {
    expect(humanizeAreaName("HA9", "postcode_district")).toBe("HA9");
  });

  it("keeps a real town name at local_authority level", () => {
    expect(humanizeAreaName("Harrow", "local_authority")).toBe("Harrow");
  });

  it("replaces a raw MSOA code with a friendly label", () => {
    expect(humanizeAreaName("E02000244", "msoa")).toBe("Neighbourhood");
  });

  it("replaces a raw LSOA code with a friendly label", () => {
    expect(humanizeAreaName("E01001316", "lsoa")).toBe("Local area");
  });

  it("falls back to the level label when name is null/empty", () => {
    expect(humanizeAreaName(null, "msoa")).toBe("Neighbourhood");
    expect(humanizeAreaName("", "lsoa")).toBe("Local area");
  });

  it("never returns a raw ONS code", () => {
    expect(humanizeAreaName("E02000244", "msoa")).not.toMatch(/^[EWSNK]\d{8}$/);
  });
});

describe("areaHref", () => {
  it("links to the area detail route", () => {
    expect(areaHref("E09000009")).toBe("/search/market-map/E09000009");
  });

  it("encodes ids that need escaping", () => {
    expect(areaHref("E&1")).toBe("/search/market-map/E%261");
  });
});
