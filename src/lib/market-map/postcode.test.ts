import { describe, it, expect } from "vitest";
import { normalisePostcode, postcodeJoinKey, outwardCode } from "./postcode";

describe("normalisePostcode", () => {
  it("uppercases and trims", () => {
    expect(normalisePostcode("  sw18 1aa ")).toBe("SW18 1AA");
  });
  it("collapses internal whitespace to a single space", () => {
    expect(normalisePostcode("sw18   1aa")).toBe("SW18 1AA");
  });
  it("preserves the outward/inward space", () => {
    expect(normalisePostcode("SW18 1AA")).toBe("SW18 1AA");
  });
});

describe("postcodeJoinKey", () => {
  it("removes all spacing so spaced and unspaced forms match", () => {
    expect(postcodeJoinKey("SW18 1AA")).toBe("SW181AA");
    expect(postcodeJoinKey("sw181aa")).toBe("SW181AA");
  });
});

describe("outwardCode", () => {
  it("extracts the district from a spaced postcode", () => {
    expect(outwardCode("SW18 1AA")).toBe("SW18");
    expect(outwardCode("sw11 6qe")).toBe("SW11");
  });
  it("handles short districts", () => {
    expect(outwardCode("W8 4AB")).toBe("W8");
    expect(outwardCode("E1 6AN")).toBe("E1");
  });
  it("derives the outward code when no space is present", () => {
    expect(outwardCode("SW181AA")).toBe("SW18");
    expect(outwardCode("w84ab")).toBe("W8");
  });
  it("returns empty string for empty/whitespace input", () => {
    expect(outwardCode("")).toBe("");
    expect(outwardCode("   ")).toBe("");
  });
});
