import { describe, expect, test } from "vitest";
import { filterDevelopments, parseNewHomesFilters } from "./filters";
import type { DevelopmentCard } from "./types";

function card(overrides: Partial<DevelopmentCard> = {}): DevelopmentCard {
  return {
    id: Math.random().toString(36),
    slug: "dev",
    name: "Edgbaston Gardens",
    summary: null,
    city: "Birmingham",
    region: "West Midlands",
    postcode: "B15 2LZ",
    priceMin: 320000,
    priceMax: 450000,
    bedsMin: 3,
    bedsMax: 4,
    totalUnits: 14,
    availableUnits: 8,
    schemeType: "houses",
    status: "available",
    completionDate: "2026-09-30",
    helpToBuy: true,
    firstHomes: false,
    sharedOwnership: false,
    heroImageUrl: null,
    developer: { id: "d1", slug: "calthorpe", name: "Calthorpe Homes", logoUrl: null, brandColour: null },
    ...overrides,
  };
}

describe("filterDevelopments", () => {
  test("returns all when no filters applied", () => {
    const items = [card(), card({ city: "Leeds" })];
    expect(filterDevelopments(items, {})).toHaveLength(2);
  });

  test("matches query against city, name and developer", () => {
    const items = [card({ city: "Birmingham" }), card({ city: "Leeds", name: "Kirkstall Forge" })];
    expect(filterDevelopments(items, { q: "leeds" })).toHaveLength(1);
    expect(filterDevelopments(items, { q: "calthorpe" })).toHaveLength(2);
    expect(filterDevelopments(items, { q: "kirkstall" })[0].city).toBe("Leeds");
  });

  test("filters by max price using range overlap", () => {
    const items = [card({ priceMin: 320000 }), card({ priceMin: 600000, priceMax: 800000 })];
    // maxPrice 400k excludes the development whose minimum is 600k
    expect(filterDevelopments(items, { maxPrice: 400000 })).toHaveLength(1);
  });

  test("filters by minimum bedrooms", () => {
    const items = [card({ bedsMax: 2 }), card({ bedsMax: 4 })];
    expect(filterDevelopments(items, { bedsMin: 3 })).toHaveLength(1);
  });

  test("filters by Help to Buy eligibility", () => {
    const items = [card({ helpToBuy: true }), card({ helpToBuy: false })];
    expect(filterDevelopments(items, { helpToBuy: true })).toHaveLength(1);
  });

  test("filters by scheme type and status", () => {
    const items = [
      card({ schemeType: "houses", status: "available" }),
      card({ schemeType: "apartments", status: "coming_soon" }),
    ];
    expect(filterDevelopments(items, { schemeType: "apartments" })).toHaveLength(1);
    expect(filterDevelopments(items, { status: "coming_soon" })).toHaveLength(1);
  });
});

describe("parseNewHomesFilters", () => {
  test("parses URLSearchParams into typed filters", () => {
    const params = new URLSearchParams(
      "q=leeds&maxPrice=400000&beds=3&scheme=houses&status=available&helpToBuy=1",
    );
    const filters = parseNewHomesFilters(params);
    expect(filters).toMatchObject({
      q: "leeds",
      maxPrice: 400000,
      bedsMin: 3,
      schemeType: "houses",
      status: "available",
      helpToBuy: true,
    });
  });

  test("ignores invalid scheme/status values", () => {
    const filters = parseNewHomesFilters({ scheme: "castles", status: "demolished" });
    expect(filters.schemeType).toBeUndefined();
    expect(filters.status).toBeUndefined();
  });
});
