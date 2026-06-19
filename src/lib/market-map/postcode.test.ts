import { describe, it, expect } from "vitest";
import {
  normalisePostcode,
  postcodeArea,
  postcodeDistrict,
  postcodeSector,
} from "./postcode";

// ---------------------------------------------------------------------------
// normalisePostcode — canonical UK postcode normalisation
// ---------------------------------------------------------------------------

describe("normalisePostcode", () => {
  // -------------------------------------------------------------------------
  // Core canonical output shape
  // -------------------------------------------------------------------------

  it("M1 4BH: joinKey has no spaces, display has canonical space", () => {
    const result = normalisePostcode("M1 4BH");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("M14BH");
    expect(result!.display).toBe("M1 4BH");
    expect(result!.area).toBe("M");
    expect(result!.district).toBe("M1");
    expect(result!.sector).toBe("M1 4");
  });

  it("SW1A 1AA: two-letter area + four-char district", () => {
    const result = normalisePostcode("SW1A 1AA");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("SW1A1AA");
    expect(result!.display).toBe("SW1A 1AA");
    expect(result!.area).toBe("SW");
    expect(result!.district).toBe("SW1A");
    expect(result!.sector).toBe("SW1A 1");
  });

  // -------------------------------------------------------------------------
  // Input normalisation: whitespace and casing
  // -------------------------------------------------------------------------

  it("extra surrounding spaces are trimmed", () => {
    const result = normalisePostcode("  M1 4BH  ");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("M14BH");
    expect(result!.display).toBe("M1 4BH");
  });

  it("lowercase input is uppercased", () => {
    const result = normalisePostcode("m1 4bh");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("M14BH");
    expect(result!.display).toBe("M1 4BH");
  });

  it("extra internal spaces are collapsed (e.g. ' m1  4bh ')", () => {
    const result = normalisePostcode(" m1  4bh ");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("M14BH");
    expect(result!.display).toBe("M1 4BH");
    expect(result!.area).toBe("M");
    expect(result!.district).toBe("M1");
    expect(result!.sector).toBe("M1 4");
  });

  it("no-space input (e.g. 'EC1A1BB') is accepted and split correctly", () => {
    const result = normalisePostcode("EC1A1BB");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("EC1A1BB");
    expect(result!.display).toBe("EC1A 1BB");
    expect(result!.area).toBe("EC");
    expect(result!.district).toBe("EC1A");
    expect(result!.sector).toBe("EC1A 1");
  });

  // -------------------------------------------------------------------------
  // Additional postcodes covering various formats
  // -------------------------------------------------------------------------

  it("SW1A 2AA (Houses of Parliament)", () => {
    const result = normalisePostcode("SW1A 2AA");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("SW1A2AA");
    expect(result!.display).toBe("SW1A 2AA");
    expect(result!.area).toBe("SW");
    expect(result!.district).toBe("SW1A");
    expect(result!.sector).toBe("SW1A 2");
  });

  it("EC1A 1BB: two-letter area, district with digit+alpha", () => {
    const result = normalisePostcode("EC1A 1BB");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("EC1A1BB");
    expect(result!.display).toBe("EC1A 1BB");
    expect(result!.area).toBe("EC");
    expect(result!.district).toBe("EC1A");
    expect(result!.sector).toBe("EC1A 1");
  });

  it("W1A 0AX: one-letter area, district with digit+alpha", () => {
    const result = normalisePostcode("W1A 0AX");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("W1A0AX");
    expect(result!.display).toBe("W1A 0AX");
    expect(result!.area).toBe("W");
    expect(result!.district).toBe("W1A");
    expect(result!.sector).toBe("W1A 0");
  });

  it("B1 1BB: one-letter area, single-digit district", () => {
    const result = normalisePostcode("B1 1BB");
    expect(result).not.toBeNull();
    expect(result!.joinKey).toBe("B11BB");
    expect(result!.display).toBe("B1 1BB");
    expect(result!.area).toBe("B");
    expect(result!.district).toBe("B1");
    expect(result!.sector).toBe("B1 1");
  });

  // -------------------------------------------------------------------------
  // Null / empty / invalid inputs — must return null, not throw
  // -------------------------------------------------------------------------

  it("null input → null", () => {
    expect(normalisePostcode(null)).toBeNull();
  });

  it("undefined input → null", () => {
    expect(normalisePostcode(undefined)).toBeNull();
  });

  it("empty string → null", () => {
    expect(normalisePostcode("")).toBeNull();
  });

  it("whitespace-only string → null", () => {
    expect(normalisePostcode("   ")).toBeNull();
  });

  it("clearly invalid string → null", () => {
    expect(normalisePostcode("NOTAPOSTCODE")).toBeNull();
  });

  it("partial postcode (outward only) → null", () => {
    expect(normalisePostcode("M1")).toBeNull();
  });

  it("numbers only → null", () => {
    expect(normalisePostcode("12345")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// postcodeArea helper
// ---------------------------------------------------------------------------

describe("postcodeArea", () => {
  it("returns area for valid postcode", () => {
    expect(postcodeArea("M1 4BH")).toBe("M");
    expect(postcodeArea("SW1A 1AA")).toBe("SW");
    expect(postcodeArea("EC1A 1BB")).toBe("EC");
  });

  it("returns null for invalid postcode", () => {
    expect(postcodeArea("NOTAPOSTCODE")).toBeNull();
    expect(postcodeArea(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// postcodeDistrict helper
// ---------------------------------------------------------------------------

describe("postcodeDistrict", () => {
  it("returns district for valid postcode", () => {
    expect(postcodeDistrict("M1 4BH")).toBe("M1");
    expect(postcodeDistrict("SW1A 1AA")).toBe("SW1A");
    expect(postcodeDistrict("EC1A 1BB")).toBe("EC1A");
  });

  it("returns null for invalid postcode", () => {
    expect(postcodeDistrict("NOTAPOSTCODE")).toBeNull();
    expect(postcodeDistrict(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// postcodeSector helper
// ---------------------------------------------------------------------------

describe("postcodeSector", () => {
  it("returns sector for valid postcode", () => {
    expect(postcodeSector("M1 4BH")).toBe("M1 4");
    expect(postcodeSector("SW1A 1AA")).toBe("SW1A 1");
    expect(postcodeSector("EC1A 1BB")).toBe("EC1A 1");
  });

  it("returns null for invalid postcode", () => {
    expect(postcodeSector("NOTAPOSTCODE")).toBeNull();
    expect(postcodeSector(null)).toBeNull();
  });
});
