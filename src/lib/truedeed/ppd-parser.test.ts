/**
 * Tests for truedeed/ppd-parser (TDD RED — module not yet implemented)
 *
 * Pins the contract of @/lib/truedeed/ppd-parser per
 * docs/truedeed/attribution-tracking-spec.md §4.1:
 *
 * HMLR PPD monthly-update CSV — quoted fields, NO header row, column order:
 *   1 transaction unique id (braced GUID — braces stripped to tuid)
 *   2 price (integral pounds → pricePence = pounds × 100)
 *   3 transfer date ("YYYY-MM-DD 00:00" → "YYYY-MM-DD")
 *   4 postcode            5 property type (D/S/T/F/O)
 *   6 new-build flag (Y/N → boolean)
 *   7 tenure (F/L)        8 PAON   9 SAON   10 street
 *   11 locality  12 town  13 district  14 county
 *   15 PPD category (A/B)
 *   16 record status (A=addition, C=change, D=delete)
 *
 * Empty strings in optional address fields → null.
 * Malformed lines (wrong column count) → null.
 * iteratePpdCsv handles CRLF and skips blank/trailing-blank lines.
 */

import { describe, it, expect } from "vitest";

import {
  parsePpdCsvLine,
  iteratePpdCsv,
  type ParsedPpdRow,
} from "@/lib/truedeed/ppd-parser";

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

const GUID = "8A4F1D2E-3B5C-4F6A-9E8D-7C1B2A3F4E5D";

/** Field values for a realistic synthetic monthly-update row, in column order. */
const BASE_FIELDS = {
  tuid: `{${GUID}}`,
  price: "250000",
  date: "2026-03-14 00:00",
  postcode: "SW1A 1AA",
  propertyType: "T",
  newBuild: "N",
  tenure: "F",
  paon: "12",
  saon: "",
  street: "DOWNING STREET",
  locality: "",
  town: "LONDON",
  district: "CITY OF WESTMINSTER",
  county: "GREATER LONDON",
  category: "A",
  status: "A",
};

/** Build a quoted 16-column PPD CSV line, overriding individual fields. */
const buildLine = (overrides: Partial<typeof BASE_FIELDS> = {}): string =>
  Object.values({ ...BASE_FIELDS, ...overrides })
    .map((v) => `"${v}"`)
    .join(",");

// ---------------------------------------------------------------------------
// 1. parsePpdCsvLine — realistic row
// ---------------------------------------------------------------------------

describe("parsePpdCsvLine", () => {
  it("parses a realistic monthly-update line, pinning every field", () => {
    // Act
    const row = parsePpdCsvLine(buildLine());

    // Assert
    expect(row).toEqual<ParsedPpdRow>({
      tuid: GUID, // braces stripped
      pricePence: 25000000, // £250,000 → pence
      transferDate: "2026-03-14", // time-of-day discarded
      postcode: "SW1A 1AA",
      propertyType: "T",
      newBuild: false, // "N"
      tenure: "F",
      paon: "12",
      saon: null, // empty string → null
      street: "DOWNING STREET",
      locality: null, // empty string → null
      town: "LONDON",
      district: "CITY OF WESTMINSTER",
      county: "GREATER LONDON",
      ppdCategory: "A",
      recordStatus: "A",
    });
  });

  it("converts integral pounds to pence (×100)", () => {
    // Arrange
    const line = buildLine({ price: "550000" });

    // Act
    const row = parsePpdCsvLine(line);

    // Assert
    expect(row!.pricePence).toBe(55000000);
  });

  it("parses new-build 'Y' as true", () => {
    const row = parsePpdCsvLine(buildLine({ newBuild: "Y" }));

    expect(row!.newBuild).toBe(true);
  });

  it("parses an empty postcode field as null", () => {
    const row = parsePpdCsvLine(buildLine({ postcode: "" }));

    expect(row!.postcode).toBeNull();
  });

  it("handles a quoted comma inside a field without shifting columns", () => {
    // Arrange
    const line = buildLine({ saon: "FLAT 1, THE TOWER" });

    // Act
    const row = parsePpdCsvLine(line);

    // Assert — SAON keeps its comma, neighbouring columns stay aligned
    expect(row!.saon).toBe("FLAT 1, THE TOWER");
    expect(row!.paon).toBe("12");
    expect(row!.street).toBe("DOWNING STREET");
    expect(row!.recordStatus).toBe("A");
  });

  it("returns null for a malformed line (wrong column count)", () => {
    // Arrange — drop the final column (15 fields instead of 16)
    const truncated = buildLine().split(",").slice(0, 15).join(",");

    // Act + Assert
    expect(parsePpdCsvLine(truncated)).toBeNull();
    expect(parsePpdCsvLine('"just","four","odd","fields"')).toBeNull();
  });

  it("parses record statuses C (change) and D (delete)", () => {
    // Act
    const changed = parsePpdCsvLine(buildLine({ status: "C" }));
    const deleted = parsePpdCsvLine(buildLine({ status: "D" }));

    // Assert
    expect(changed!.recordStatus).toBe("C");
    expect(deleted!.recordStatus).toBe("D");
  });
});

// ---------------------------------------------------------------------------
// 2. iteratePpdCsv — streaming over multi-line text
// ---------------------------------------------------------------------------

describe("iteratePpdCsv", () => {
  it("yields one parsed row per line, in file order", () => {
    // Arrange
    const guid2 = "1B2C3D4E-5F6A-4B7C-8D9E-0F1A2B3C4D5E";
    const text = [
      buildLine(),
      buildLine({ tuid: `{${guid2}}`, price: "310000" }),
    ].join("\n");

    // Act
    const rows = [...iteratePpdCsv(text)];

    // Assert
    expect(rows).toHaveLength(2);
    expect(rows[0].tuid).toBe(GUID);
    expect(rows[1].tuid).toBe(guid2);
    expect(rows[1].pricePence).toBe(31000000);
  });

  it("handles CRLF line endings without corrupting the final column", () => {
    // Arrange
    const text = [buildLine(), buildLine({ status: "C" })].join("\r\n");

    // Act
    const rows = [...iteratePpdCsv(text)];

    // Assert
    expect(rows).toHaveLength(2);
    expect(rows[0].recordStatus).toBe("A"); // not "A\r"
    expect(rows[1].recordStatus).toBe("C");
  });

  it("skips blank and trailing blank lines", () => {
    // Arrange — blank line mid-file plus trailing newlines
    const text = `${buildLine()}\n\n${buildLine({ status: "C" })}\r\n\r\n\n`;

    // Act
    const rows = [...iteratePpdCsv(text)];

    // Assert
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.recordStatus)).toEqual(["A", "C"]);
  });
});
