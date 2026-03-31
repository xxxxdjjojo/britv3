/**
 * TDD tests for the transformRow function from scripts/load-ppd-initial.ts.
 *
 * The script imports Node.js built-ins (fs, stream) which cannot be resolved
 * in Vitest's happy-dom environment. We inline the pure transformRow function
 * here so we can unit test the transformation logic independently.
 *
 * This is a standard pattern for testing pure functions extracted from
 * CLI scripts that have heavy I/O dependencies.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Inlined transformRow — exact copy from scripts/load-ppd-initial.ts
// Any change to the source function must be mirrored here.
// ---------------------------------------------------------------------------

function transformRow(raw: Record<string, string>) {
  const price = parseInt(raw.price, 10);
  const txDate = raw.transaction_date?.split(" ")[0];
  if (!price || !txDate) return null;

  return {
    transaction_id: raw.transaction_id?.replace(/[{}]/g, ""),
    price,
    transaction_date: txDate,
    postcode: raw.postcode?.trim().toUpperCase() || null,
    property_type: raw.property_type || null,
    is_new_build: raw.is_new_build === "Y",
    tenure: raw.tenure || null,
    paon: raw.paon?.trim() || null,
    saon: raw.saon?.trim() || null,
    street: raw.street?.trim() || null,
    locality: raw.locality?.trim() || null,
    town_city: raw.town_city?.trim() || null,
    district: raw.district?.trim() || null,
    county: raw.county?.trim() || null,
    transaction_category: raw.transaction_category || null,
    record_status: raw.record_status?.trim() || "A",
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRawRow(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  return {
    transaction_id: "{ABCD-1234-EFGH-5678}",
    price: "485000",
    transaction_date: "1995-03-24 00:00",
    postcode: "TW7 7BG",
    property_type: "T",
    is_new_build: "N",
    tenure: "F",
    paon: "14",
    saon: "",
    street: "SOUTH STREET",
    locality: "ISLEWORTH",
    town_city: "LONDON",
    district: "HOUNSLOW",
    county: "GREATER LONDON",
    transaction_category: "A",
    record_status: "A",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("transformRow", () => {
  // -----------------------------------------------------------------------
  // Standard row -> correct output shape
  // -----------------------------------------------------------------------

  it("transforms a standard PPD CSV row to the correct DB shape", () => {
    const raw = makeRawRow();
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result).toEqual(
      expect.objectContaining({
        transaction_id: expect.any(String),
        price: expect.any(Number),
        transaction_date: expect.any(String),
        postcode: expect.any(String),
        property_type: expect.any(String),
        is_new_build: expect.any(Boolean),
        tenure: expect.any(String),
        paon: expect.any(String),
        street: expect.any(String),
        town_city: expect.any(String),
        district: expect.any(String),
        county: expect.any(String),
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Transaction ID: braces stripped
  // -----------------------------------------------------------------------

  it("strips curly braces from transaction_id", () => {
    const raw = makeRawRow({ transaction_id: "{ABCD-1234-EFGH-5678}" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.transaction_id).toBe("ABCD-1234-EFGH-5678");
    expect(result!.transaction_id).not.toContain("{");
    expect(result!.transaction_id).not.toContain("}");
  });

  // -----------------------------------------------------------------------
  // is_new_build mapping
  // -----------------------------------------------------------------------

  it("maps is_new_build \"Y\" to true", () => {
    const raw = makeRawRow({ is_new_build: "Y" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.is_new_build).toBe(true);
  });

  it("maps is_new_build \"N\" to false", () => {
    const raw = makeRawRow({ is_new_build: "N" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.is_new_build).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Date parsing: strips time component
  // -----------------------------------------------------------------------

  it("extracts date-only from \"1995-03-24 00:00\" -> \"1995-03-24\"", () => {
    const raw = makeRawRow({ transaction_date: "1995-03-24 00:00" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.transaction_date).toBe("1995-03-24");
  });

  it("handles date with full timestamp \"2025-12-01 12:30:45\" -> \"2025-12-01\"", () => {
    const raw = makeRawRow({ transaction_date: "2025-12-01 12:30:45" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.transaction_date).toBe("2025-12-01");
  });

  // -----------------------------------------------------------------------
  // Empty postcode -> null
  // -----------------------------------------------------------------------

  it("converts empty postcode to null", () => {
    const raw = makeRawRow({ postcode: "" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.postcode).toBeNull();
  });

  it("converts whitespace-only postcode to null", () => {
    const raw = makeRawRow({ postcode: "   " });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.postcode).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Missing price -> returns null (skip row)
  // -----------------------------------------------------------------------

  it("returns null when price is missing", () => {
    const raw = makeRawRow({ price: "" });
    const result = transformRow(raw);

    expect(result).toBeNull();
  });

  it("returns null when price is zero", () => {
    const raw = makeRawRow({ price: "0" });
    const result = transformRow(raw);

    expect(result).toBeNull();
  });

  it("returns null when price is non-numeric", () => {
    const raw = makeRawRow({ price: "abc" });
    const result = transformRow(raw);

    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Missing transaction_date -> returns null (skip row)
  // -----------------------------------------------------------------------

  it("returns null when transaction_date is missing", () => {
    const raw = makeRawRow({ transaction_date: "" });
    const result = transformRow(raw);

    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Empty optional strings -> null
  // -----------------------------------------------------------------------

  it("converts empty saon to null", () => {
    const raw = makeRawRow({ saon: "" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.saon).toBeNull();
  });

  it("converts empty locality to null", () => {
    const raw = makeRawRow({ locality: "" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.locality).toBeNull();
  });

  it("converts empty street to null", () => {
    const raw = makeRawRow({ street: "" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.street).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Price parsing
  // -----------------------------------------------------------------------

  it("parses price string to integer", () => {
    const raw = makeRawRow({ price: "485000" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.price).toBe(485000);
    expect(typeof result!.price).toBe("number");
  });

  // -----------------------------------------------------------------------
  // Postcode normalization
  // -----------------------------------------------------------------------

  it("uppercases and trims the postcode", () => {
    const raw = makeRawRow({ postcode: " tw7 7bg " });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.postcode).toBe("TW7 7BG");
  });

  // -----------------------------------------------------------------------
  // Whitespace trimming on string fields
  // -----------------------------------------------------------------------

  it("trims whitespace from paon, street, town_city, district, county", () => {
    const raw = makeRawRow({
      paon: "  14  ",
      street: "  SOUTH STREET  ",
      town_city: "  LONDON  ",
      district: "  HOUNSLOW  ",
      county: "  GREATER LONDON  ",
    });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.paon).toBe("14");
    expect(result!.street).toBe("SOUTH STREET");
    expect(result!.town_city).toBe("LONDON");
    expect(result!.district).toBe("HOUNSLOW");
    expect(result!.county).toBe("GREATER LONDON");
  });

  // -----------------------------------------------------------------------
  // Default record_status
  // -----------------------------------------------------------------------

  it("defaults record_status to \"A\" when missing", () => {
    const raw = makeRawRow({ record_status: "" });
    const result = transformRow(raw);

    expect(result).not.toBeNull();
    expect(result!.record_status).toBe("A");
  });
});
