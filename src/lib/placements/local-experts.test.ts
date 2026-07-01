import { describe, it, expect } from "vitest";

import type { FeaturedExpert } from "@/types/sponsored-placements";
import type { LocalExpertRow } from "@/types/local-experts";
import {
  categoryPriority,
  scoreLocalRow,
  blendLocalExperts,
  rowToLocalExpert,
} from "./local-experts";

function row(overrides: Partial<LocalExpertRow> = {}): LocalExpertRow {
  return {
    provider_id: "org-1",
    business_name: "Org Trader",
    slug: "org-trader",
    avatar_url: null,
    services: ["plumber"],
    service_postcodes: ["W5"],
    primary_category: "plumber",
    average_rating: 4.2,
    total_reviews: 12,
    response_rate: 80,
    response_time_hours: 3,
    years_in_business: 8,
    completed_jobs_count: 40,
    business_description: "Reliable local plumber",
    qualifications: ["Gas Safe"],
    portfolio_urls: [],
    location_match: "postcode",
    ...overrides,
  };
}

function sponsored(overrides: Partial<FeaturedExpert> = {}): FeaturedExpert {
  return {
    placementId: "pl-1",
    providerId: "spon-1",
    slug: "sponsored-trader",
    businessName: "Sponsored Trader",
    avatarUrl: null,
    category: "builder",
    primaryService: "Builder",
    placementType: "category_leader",
    averageRating: 4.0,
    totalReviews: 5,
    responseTimeHours: 6,
    serviceArea: "W5",
    valueProposition: "Top-rated local builder",
    isVerified: true,
    ...overrides,
  };
}

describe("categoryPriority", () => {
  it("prioritises the sale buying journey order for a sale with no renovation", () => {
    const order = categoryPriority("sale", false);
    // Surveyor, mortgage, conveyancer lead the buying journey.
    expect(order.slice(0, 3)).toEqual(["surveying", "mortgage_broker", "conveyancing"]);
    expect(order).toContain("builder");
    expect(order).toContain("moving_company");
  });

  it("leads with renovation trades when a sale has renovation potential", () => {
    const order = categoryPriority("sale", true);
    expect(order[0]).toBe("builder");
    expect(order.slice(0, 4)).toEqual(["builder", "architect", "electrician", "plumber"]);
    // Buying-journey categories still appear, just lower down.
    expect(order).toContain("surveying");
  });

  it("uses the move-in journey for rentals", () => {
    const order = categoryPriority("rent", false);
    expect(order[0]).toBe("moving_company");
    expect(order).toContain("cleaning");
    expect(order).toContain("handyman");
    expect(order).toContain("locksmith");
    // Renovation trades are not relevant to a renter.
    expect(order).not.toContain("architect");
  });

  it("returns a de-duplicated list", () => {
    const order = categoryPriority("sale", true);
    expect(new Set(order).size).toBe(order.length);
  });
});

describe("scoreLocalRow", () => {
  const order = categoryPriority("sale", true);

  it("ranks a higher-rated, postcode-matched trader above a weaker one", () => {
    const strong = scoreLocalRow(row({ average_rating: 4.8, location_match: "postcode" }), order);
    const weak = scoreLocalRow(row({ average_rating: 2.5, location_match: "none" }), order);
    expect(strong).toBeGreaterThan(weak);
  });

  it("rewards relevance: a top-priority category outranks a fringe one, all else equal", () => {
    const builder = scoreLocalRow(row({ primary_category: "builder" }), order);
    const fringe = scoreLocalRow(row({ primary_category: "landscaping" }), order);
    expect(builder).toBeGreaterThan(fringe);
  });

  it("never lets category relevance override trust entirely", () => {
    // A fringe-category but excellent trader beats a top-category mediocre one.
    const excellentFringe = scoreLocalRow(
      row({ primary_category: "landscaping", average_rating: 5, total_reviews: 50, location_match: "postcode" }),
      order,
    );
    const mediocreTop = scoreLocalRow(
      row({ primary_category: "builder", average_rating: 2.0, total_reviews: 0, location_match: "none" }),
      order,
    );
    expect(excellentFringe).toBeGreaterThan(mediocreTop);
  });
});

describe("rowToLocalExpert", () => {
  it("maps an organic row to a non-sponsored, verified card", () => {
    const card = rowToLocalExpert(row());
    expect(card.isSponsored).toBe(false);
    expect(card.placementId).toBeNull();
    expect(card.isVerified).toBe(true);
    expect(card.primaryService).toBe("Plumber");
    expect(card.yearsInBusiness).toBe(8);
    expect(card.serviceArea).toBe("W5");
  });
});

describe("blendLocalExperts", () => {
  const order = categoryPriority("sale", true);

  it("returns organic verified traders even when there are no sponsored cards", () => {
    const result = blendLocalExperts({
      sponsored: [],
      organic: [row({ provider_id: "a" }), row({ provider_id: "b" })],
      limit: 3,
      sponsoredLimit: 2,
      categoryOrder: order,
    });
    expect(result).toHaveLength(2);
    expect(result.every((e) => !e.isSponsored)).toBe(true);
  });

  it("places sponsored cards first and labels them, but keeps organic cards present", () => {
    const result = blendLocalExperts({
      sponsored: [sponsored()],
      organic: [row({ provider_id: "a" }), row({ provider_id: "b" })],
      limit: 3,
      sponsoredLimit: 2,
      categoryOrder: order,
    });
    expect(result).toHaveLength(3);
    expect(result[0]?.isSponsored).toBe(true);
    expect(result[0]?.placementId).toBe("pl-1");
    expect(result.filter((e) => !e.isSponsored)).toHaveLength(2);
  });

  it("caps sponsored cards at sponsoredLimit (no advert board)", () => {
    const result = blendLocalExperts({
      sponsored: [sponsored({ providerId: "s1", placementId: "p1" }), sponsored({ providerId: "s2", placementId: "p2" }), sponsored({ providerId: "s3", placementId: "p3" })],
      organic: [row({ provider_id: "a" })],
      limit: 6,
      sponsoredLimit: 2,
      categoryOrder: order,
    });
    expect(result.filter((e) => e.isSponsored)).toHaveLength(2);
  });

  it("de-duplicates a provider that is both sponsored and organically matched", () => {
    const result = blendLocalExperts({
      sponsored: [sponsored({ providerId: "dup", placementId: "pl-dup" })],
      organic: [row({ provider_id: "dup" }), row({ provider_id: "other" })],
      limit: 6,
      sponsoredLimit: 2,
      categoryOrder: order,
    });
    const dupCards = result.filter((e) => e.providerId === "dup");
    expect(dupCards).toHaveLength(1);
    expect(dupCards[0]?.isSponsored).toBe(true);
  });

  it("orders organic cards by the blended trust/relevance score", () => {
    const result = blendLocalExperts({
      sponsored: [],
      organic: [
        row({ provider_id: "weak", average_rating: 2.0, total_reviews: 0, location_match: "none", primary_category: "landscaping" }),
        row({ provider_id: "strong", average_rating: 4.9, total_reviews: 50, location_match: "postcode", primary_category: "builder" }),
      ],
      limit: 3,
      sponsoredLimit: 2,
      categoryOrder: order,
    });
    expect(result[0]?.providerId).toBe("strong");
  });

  it("respects the overall limit", () => {
    const result = blendLocalExperts({
      sponsored: [sponsored()],
      organic: [row({ provider_id: "a" }), row({ provider_id: "b" }), row({ provider_id: "c" })],
      limit: 3,
      sponsoredLimit: 2,
      categoryOrder: order,
    });
    expect(result).toHaveLength(3);
  });

  it("does not mutate its inputs", () => {
    const organic = [row({ provider_id: "a" })];
    const frozen = Object.freeze([...organic]);
    blendLocalExperts({ sponsored: [], organic: frozen, limit: 3, sponsoredLimit: 2, categoryOrder: order });
    expect(organic).toHaveLength(1);
  });
});
