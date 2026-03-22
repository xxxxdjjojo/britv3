import { describe, it, expect } from "vitest";
import { getRequiredCategories } from "@/lib/compliance-constants";

describe("getRequiredCategories", () => {
  it("returns 5 categories for standard property", () => {
    const cats = getRequiredCategories(false);
    expect(cats.length).toBe(5);
    expect(cats.every(c => !c.hmoOnly)).toBe(true);
  });

  it("returns 7 categories for HMO property", () => {
    const cats = getRequiredCategories(true);
    expect(cats.length).toBe(7);
    expect(cats.some(c => c.key === "hmo_licence")).toBe(true);
    expect(cats.some(c => c.key === "fire_safety")).toBe(true);
  });
});
