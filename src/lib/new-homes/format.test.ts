import { describe, expect, test } from "vitest";
import {
  developmentStatusLabel,
  formatBedsRange,
  formatCompletion,
  formatGbp,
  formatPriceRange,
  schemeTypeLabel,
} from "./format";

describe("formatGbp", () => {
  test("formats whole pounds with no decimals", () => {
    expect(formatGbp(320000)).toBe("£320,000");
  });
  test("returns POA when null", () => {
    expect(formatGbp(null)).toBe("POA");
  });
});

describe("formatPriceRange", () => {
  test("shows a range when min and max differ", () => {
    expect(formatPriceRange(320000, 450000)).toBe("£320,000 – £450,000");
  });
  test("shows 'From' when only one value", () => {
    expect(formatPriceRange(320000, 320000)).toBe("From £320,000");
    expect(formatPriceRange(320000, null)).toBe("From £320,000");
  });
  test("handles no pricing", () => {
    expect(formatPriceRange(null, null)).toBe("Prices on application");
  });
});

describe("formatBedsRange", () => {
  test("renders a range or single value", () => {
    expect(formatBedsRange(3, 4)).toBe("3–4 bed");
    expect(formatBedsRange(2, 2)).toBe("2 bed");
    expect(formatBedsRange(null, null)).toBe("—");
  });
});

describe("formatCompletion", () => {
  test("renders a Ready Qx Year label", () => {
    expect(formatCompletion("2026-09-30")).toBe("Ready Q3 2026");
    expect(formatCompletion("2027-01-15")).toBe("Ready Q1 2027");
  });
  test("returns null for missing/invalid dates", () => {
    expect(formatCompletion(null)).toBeNull();
    expect(formatCompletion("not-a-date")).toBeNull();
  });
});

describe("labels", () => {
  test("maps status and scheme enums to friendly labels", () => {
    expect(developmentStatusLabel("coming_soon")).toBe("Coming soon");
    expect(developmentStatusLabel("sold_out")).toBe("Sold out");
    expect(schemeTypeLabel("shared_ownership")).toBe("Shared ownership");
  });
});
