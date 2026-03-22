import { describe, it, expect } from "vitest";
import { isAllClear, type AllClearInput } from "@/lib/all-clear-check";

const GREEN: AllClearInput = {
  totalOverdueRent: 0,
  expiredCompliance: 0,
  expiringSoonCompliance: 0,
  openMaintenance: 0,
  totalProperties: 3,
};

describe("isAllClear", () => {
  it("returns true when everything is green", () => {
    expect(isAllClear(GREEN)).toBe(true);
  });

  it("returns false when rent is overdue", () => {
    expect(isAllClear({ ...GREEN, totalOverdueRent: 1 })).toBe(false);
  });

  it("returns false when compliance is expired", () => {
    expect(isAllClear({ ...GREEN, expiredCompliance: 2 })).toBe(false);
  });

  it("returns false when compliance is expiring soon", () => {
    expect(isAllClear({ ...GREEN, expiringSoonCompliance: 1 })).toBe(false);
  });

  it("returns false when maintenance is open", () => {
    expect(isAllClear({ ...GREEN, openMaintenance: 4 })).toBe(false);
  });

  it("returns false when there are no properties", () => {
    expect(isAllClear({ ...GREEN, totalProperties: 0 })).toBe(false);
  });
});
