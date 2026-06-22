/**
 * Tests for rental formatting utilities.
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import {
  monthlyToWeekly,
  formatMonthlyRent,
  formatWeeklyRent,
  furnishingLabel,
  petsPolicyLabel,
  studentsPolicyLabel,
  formatAvailableFrom,
} from "@/lib/properties/rental-format";

describe("monthlyToWeekly", () => {
  it("derives weekly from monthly using 52/12 weeks-per-month", () => {
    // £1,450 pcm → £1,450 / 4.333... = £334.62
    expect(monthlyToWeekly(1450)).toBeCloseTo(334.62, 1);
  });

  it("returns null for null/undefined input", () => {
    expect(monthlyToWeekly(null)).toBeNull();
    expect(monthlyToWeekly(undefined)).toBeNull();
  });

  it("returns null for zero or negative", () => {
    expect(monthlyToWeekly(0)).toBeNull();
    expect(monthlyToWeekly(-100)).toBeNull();
  });
});

describe("formatMonthlyRent", () => {
  it("formats positive monthly rent with pcm suffix", () => {
    expect(formatMonthlyRent(1450)).toBe("£1,450 pcm");
  });

  it("returns POA for null/undefined/zero", () => {
    expect(formatMonthlyRent(null)).toBe("Price on application");
    expect(formatMonthlyRent(undefined)).toBe("Price on application");
    expect(formatMonthlyRent(0)).toBe("Price on application");
  });
});

describe("formatWeeklyRent", () => {
  it("formats positive weekly rent with pw suffix", () => {
    expect(formatWeeklyRent(334)).toBe("£334 pw");
  });

  it("returns empty string for null/undefined/zero", () => {
    expect(formatWeeklyRent(null)).toBe("");
    expect(formatWeeklyRent(0)).toBe("");
  });
});

describe("furnishingLabel", () => {
  it("converts enum values to human labels", () => {
    expect(furnishingLabel("furnished")).toBe("Furnished");
    expect(furnishingLabel("unfurnished")).toBe("Unfurnished");
    expect(furnishingLabel("part_furnished")).toBe("Part furnished");
  });

  it("returns empty string for unknown/null", () => {
    expect(furnishingLabel(null)).toBe("");
    expect(furnishingLabel("")).toBe("");
    expect(furnishingLabel("other")).toBe("");
  });
});

describe("petsPolicyLabel", () => {
  it("converts enum values to human labels", () => {
    expect(petsPolicyLabel("allowed")).toBe("Pets allowed");
    expect(petsPolicyLabel("not_allowed")).toBe("No pets");
    expect(petsPolicyLabel("by_arrangement")).toBe("Pets by arrangement");
  });

  it("returns empty string for unknown/null", () => {
    expect(petsPolicyLabel(null)).toBe("");
    expect(petsPolicyLabel("not_specified")).toBe("");
  });
});

describe("studentsPolicyLabel", () => {
  it("converts enum values to human labels", () => {
    expect(studentsPolicyLabel("accepted")).toBe("Students accepted");
    expect(studentsPolicyLabel("not_accepted")).toBe("Students not accepted");
    expect(studentsPolicyLabel("by_arrangement")).toBe("Students by arrangement");
  });

  it("returns empty string for unknown/null", () => {
    expect(studentsPolicyLabel(null)).toBe("");
    expect(studentsPolicyLabel("not_specified")).toBe("");
  });
});

describe("formatAvailableFrom", () => {
  it("formats ISO date as UK date string", () => {
    const result = formatAvailableFrom("2026-08-01");
    expect(result).toBe("1 Aug 2026");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatAvailableFrom(null)).toBe("");
    expect(formatAvailableFrom(undefined)).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatAvailableFrom("not-a-date")).toBe("");
  });
});
