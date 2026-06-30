import { describe, expect, it } from "vitest";

import type { FeaturedExpertRow } from "@/types/sponsored-placements";

import { computePerformance, rowToCandidate, rowToExpert } from "./transform";

function row(overrides: Partial<FeaturedExpertRow> = {}): FeaturedExpertRow {
  return {
    placement_id: "pl1",
    provider_id: "pr1",
    business_name: "Ealing Plumbing Co",
    slug: "ealing-plumbing-co",
    avatar_url: "a.jpg",
    services: ["plumber"],
    service_postcodes: ["W5"],
    category: "plumber",
    placement_type: "category_leader",
    region_scope: "London",
    town: "Ealing",
    postcode_district: "W5",
    average_rating: 4.7,
    total_reviews: 32,
    response_rate: 90,
    response_time_hours: 2,
    years_in_business: 8,
    completed_jobs_count: 120,
    business_description: "Reliable Gas Safe registered plumbers covering West London.",
    qualifications: ["Gas Safe"],
    portfolio_urls: ["p.jpg"],
    location_match: "town",
    admin_featured: false,
    priority_override: null,
    budget_remaining: true,
    ...overrides,
  };
}

describe("rowToCandidate", () => {
  it("maps trust and targeting signals from the RPC row", () => {
    const c = rowToCandidate(row());
    expect(c.providerId).toBe("pr1");
    expect(c.placementId).toBe("pl1");
    expect(c.averageRating).toBe(4.7);
    expect(c.totalReviews).toBe(32);
    expect(c.locationMatch).toBe("town");
    expect(c.budgetRemaining).toBe(true);
  });

  it("treats null review counts as zero", () => {
    const c = rowToCandidate(row({ total_reviews: null }));
    expect(c.totalReviews).toBe(0);
  });

  it("derives profile completeness from populated fields", () => {
    const full = rowToCandidate(row());
    const sparse = rowToCandidate(
      row({ business_description: null, qualifications: null, portfolio_urls: null, avatar_url: null }),
    );
    expect(full.profileCompleteness).toBeGreaterThan(sparse.profileCompleteness);
  });
});

describe("rowToExpert", () => {
  it("builds a premium display model", () => {
    const e = rowToExpert(row());
    expect(e.businessName).toBe("Ealing Plumbing Co");
    expect(e.primaryService.toLowerCase()).toContain("plumber");
    expect(e.isVerified).toBe(true);
    expect(e.serviceArea).toBeTruthy();
    expect(e.totalReviews).toBe(32);
  });

  it("falls back to the first service when no placement category is set", () => {
    const e = rowToExpert(row({ category: null, services: ["electrician"] }));
    expect(e.primaryService.toLowerCase()).toContain("electrician");
  });
});

describe("computePerformance", () => {
  it("computes CTR, conversion and cost-per-enquiry", () => {
    const perf = computePerformance({
      placementId: "pl1",
      impressions: 1000,
      clicks: 50,
      enquiries: 10,
      monthlyPricePence: 30000,
    });
    expect(perf.clickThroughRate).toBeCloseTo(0.05);
    expect(perf.conversionRate).toBeCloseTo(0.2);
    expect(perf.costPerEnquiryPence).toBe(3000);
  });

  it("avoids division by zero and returns null cost when no enquiries", () => {
    const perf = computePerformance({
      placementId: "pl1",
      impressions: 0,
      clicks: 0,
      enquiries: 0,
      monthlyPricePence: 30000,
    });
    expect(perf.clickThroughRate).toBe(0);
    expect(perf.conversionRate).toBe(0);
    expect(perf.costPerEnquiryPence).toBeNull();
  });
});
