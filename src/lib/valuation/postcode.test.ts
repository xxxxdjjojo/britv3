import { describe, it, expect } from "vitest";
import { normalisePostcode, outwardCode } from "./postcode";

describe("normalisePostcode", () => {
  it("canonicalises case and spacing", () => {
    expect(normalisePostcode("sw184qn")).toBe("SW18 4QN");
    expect(normalisePostcode("  Sw18  4Qn ")).toBe("SW18 4QN");
    expect(normalisePostcode("sw1a1aa")).toBe("SW1A 1AA");
  });
  it("returns null for invalid postcodes", () => {
    expect(normalisePostcode("")).toBeNull();
    expect(normalisePostcode("NOTAPOSTCODE")).toBeNull();
    expect(normalisePostcode("12345")).toBeNull();
  });
});

describe("outwardCode", () => {
  it("extracts the outward code", () => {
    expect(outwardCode("SW18 4QN")).toBe("SW18");
    expect(outwardCode("sw1a 1aa")).toBe("SW1A");
  });
  it("returns null for an invalid postcode", () => {
    expect(outwardCode("nonsense")).toBeNull();
  });
});
