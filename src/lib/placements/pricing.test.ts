import { describe, expect, it } from "vitest";

import {
  applyLaunchDiscount,
  computeProfileCompleteness,
  estimateMonthlyImpressions,
} from "./pricing";

describe("applyLaunchDiscount", () => {
  it("discounts the price during the launch window", () => {
    const price = applyLaunchDiscount(10000, { launchDiscountPct: 50, launchDiscountMonths: 3 }, 0);
    expect(price).toBe(5000);
  });

  it("charges full price once the launch window has passed", () => {
    const price = applyLaunchDiscount(10000, { launchDiscountPct: 50, launchDiscountMonths: 3 }, 3);
    expect(price).toBe(10000);
  });

  it("returns full price when there is no discount configured", () => {
    expect(applyLaunchDiscount(10000, { launchDiscountPct: 0, launchDiscountMonths: 0 }, 0)).toBe(10000);
  });
});

describe("estimateMonthlyImpressions", () => {
  it("estimates fewer impressions when a slot is shared by more advertisers", () => {
    const few = estimateMonthlyImpressions({ placementType: "town_boost", monthlyAreaViews: 10000, slotLimit: 1 });
    const many = estimateMonthlyImpressions({ placementType: "town_boost", monthlyAreaViews: 10000, slotLimit: 5 });
    expect(few).toBeGreaterThan(many);
  });

  it("returns a positive whole number", () => {
    const n = estimateMonthlyImpressions({ placementType: "postcode_boost", monthlyAreaViews: 4000, slotLimit: 2 });
    expect(n).toBeGreaterThan(0);
    expect(Number.isInteger(n)).toBe(true);
  });

  it("never divides by zero when slot limit is zero", () => {
    const n = estimateMonthlyImpressions({ placementType: "category_leader", monthlyAreaViews: 5000, slotLimit: 0 });
    expect(Number.isFinite(n)).toBe(true);
  });
});

describe("computeProfileCompleteness", () => {
  it("returns 1 for a fully populated profile", () => {
    const score = computeProfileCompleteness({
      businessName: "Acme",
      businessDescription: "We do things",
      services: ["plumber"],
      servicePostcodes: ["W5"],
      avatarUrl: "x.jpg",
      qualifications: ["Gas Safe"],
      portfolioUrls: ["p.jpg"],
    });
    expect(score).toBe(1);
  });

  it("returns a fraction for a partial profile", () => {
    const score = computeProfileCompleteness({
      businessName: "Acme",
      businessDescription: null,
      services: [],
      servicePostcodes: [],
      avatarUrl: null,
      qualifications: null,
      portfolioUrls: null,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("returns 0 for an empty profile", () => {
    const score = computeProfileCompleteness({
      businessName: "",
      businessDescription: null,
      services: [],
      servicePostcodes: [],
      avatarUrl: null,
      qualifications: null,
      portfolioUrls: null,
    });
    expect(score).toBe(0);
  });
});
