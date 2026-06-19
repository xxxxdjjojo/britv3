import { describe, it, expect } from "vitest";
import { normaliseAddressToken, buildAddressKey } from "./address";

describe("normaliseAddressToken", () => {
  it("uppercases, trims, collapses whitespace and strips punctuation", () => {
    expect(normaliseAddressToken("  14  South St. ")).toBe("14 SOUTH STREET");
  });
  it("expands common street abbreviations", () => {
    expect(normaliseAddressToken("Garratt Ln")).toBe("GARRATT LANE");
    expect(normaliseAddressToken("Spanish Rd")).toBe("SPANISH ROAD");
    expect(normaliseAddressToken("Park Ave")).toBe("PARK AVENUE");
  });
  it("returns empty string for null/empty", () => {
    expect(normaliseAddressToken(null)).toBe("");
    expect(normaliseAddressToken("")).toBe("");
  });
});

describe("buildAddressKey", () => {
  it("produces a stable canonical key", () => {
    const a = buildAddressKey({ paon: "14", saon: null, street: "South St", postcode: "sw18 4qn" });
    const b = buildAddressKey({ paon: "14", saon: "", street: "SOUTH STREET", postcode: "SW18 4QN" });
    expect(a).toBe(b);
  });
  it("does NOT merge two flats that share a building but differ by SAON", () => {
    const flat52 = buildAddressKey({ paon: "CUMMINGS HOUSE, 11", saon: "APARTMENT 52", street: "Chivers Passage", postcode: "SW18 1UA" });
    const flat53 = buildAddressKey({ paon: "CUMMINGS HOUSE, 11", saon: "APARTMENT 53", street: "Chivers Passage", postcode: "SW18 1UA" });
    expect(flat52).not.toBe(flat53);
  });
  it("distinguishes the same house number on different streets", () => {
    const onA = buildAddressKey({ paon: "14", saon: null, street: "South Street", postcode: "SW18 4QN" });
    const onB = buildAddressKey({ paon: "14", saon: null, street: "North Street", postcode: "SW18 4QN" });
    expect(onA).not.toBe(onB);
  });
});
