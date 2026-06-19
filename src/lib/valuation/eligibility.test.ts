import { describe, it, expect } from "vitest";
import { isEligibleComparable } from "./eligibility";

const base = {
  price: 450_000,
  ppdCategory: "A" as const,
  recordStatus: "A" as const,
};

describe("isEligibleComparable", () => {
  it("accepts a standard open-market sale", () => {
    expect(isEligibleComparable(base)).toBe(true);
  });
  it("excludes category B (non-open-market: repossessions, bulk transfers)", () => {
    expect(isEligibleComparable({ ...base, ppdCategory: "B" })).toBe(false);
  });
  it("excludes deleted records", () => {
    expect(isEligibleComparable({ ...base, recordStatus: "D" })).toBe(false);
  });
  it("excludes implausible prices (£1 transfers, data errors)", () => {
    expect(isEligibleComparable({ ...base, price: 1 })).toBe(false);
    expect(isEligibleComparable({ ...base, price: 500_000_000 })).toBe(false);
  });
});
