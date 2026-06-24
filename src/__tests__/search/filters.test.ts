import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";
import { searchProperties } from "@/app/(main)/search/actions";
import { getMockSearchProperties } from "@/lib/mock-data/listings";

describe("search filters (basic)", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let mockBuilder: ReturnType<ReturnType<typeof createMockSupabaseClient>["from"]>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    mockBuilder = mockClient.from("search_listings");

    // Make the builder thenable with default results
    (mockBuilder as Record<string, unknown>).then = vi.fn(
      (resolve: (v: unknown) => void) =>
        resolve({ data: MOCK_SEARCH_RESULTS, error: null, count: 5 }),
    );
  });

  it("queries search_listings view when no lat/lng", async () => {
    await buildSearchQuery(mockClient as never, { listing_type: "sale" });
    expect(mockClient.from).toHaveBeenCalledWith("search_listings");
  });

  it("applies listing_type filter with .eq", async () => {
    await buildSearchQuery(mockClient as never, { listing_type: "sale" });
    expect(mockBuilder.eq).toHaveBeenCalledWith("listing_type", "sale");
  });

  it("applies min_price filter with .gte", async () => {
    await buildSearchQuery(mockClient as never, { min_price: 200000 });
    expect(mockBuilder.gte).toHaveBeenCalledWith("price", 200000);
  });

  it("applies max_price filter with .lte", async () => {
    await buildSearchQuery(mockClient as never, { max_price: 500000 });
    expect(mockBuilder.lte).toHaveBeenCalledWith("price", 500000);
  });

  it("applies min_bedrooms filter with .gte", async () => {
    await buildSearchQuery(mockClient as never, { min_bedrooms: 3 });
    expect(mockBuilder.gte).toHaveBeenCalledWith("bedrooms", 3);
  });

  it("applies property_type filter with .in", async () => {
    await buildSearchQuery(mockClient as never, {
      property_type: ["detached", "semi_detached"],
    });
    expect(mockBuilder.in).toHaveBeenCalledWith("property_type", [
      "detached",
      "semi_detached",
    ]);
  });
});

describe("searchProperties (mock path) — bedrooms min/max", () => {
  // Enable the dev/demo search_mock_data flag so searchProperties serves the
  // canonical mock dataset. With both flags off (production default) the action
  // returns [] and never fabricates listings for real users — preserving the
  // data-integrity rule.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Any/Any returns all rows", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "Any",
    });
    expect(data.length).toBe(getMockSearchProperties().length);
  });

  it("bedsMin=3 returns rows with >= 3 beds", async () => {
    const { data } = await searchProperties({
      bedsMin: "3",
      bedsMax: "Any",
    });
    expect(data.every((p) => p.beds >= 3)).toBe(true);
  });

  it("bedsMax=2 returns rows with <= 2 beds", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "2",
    });
    expect(data.every((p) => p.beds <= 2)).toBe(true);
  });

  it("bedsMin=3 bedsMax=4 returns rows in [3,4]", async () => {
    const { data } = await searchProperties({
      bedsMin: "3",
      bedsMax: "4",
    });
    expect(data.every((p) => p.beds >= 3 && p.beds <= 4)).toBe(true);
  });

  it("bedsMax=5+ applies no upper bound", async () => {
    const { data } = await searchProperties({
      bedsMin: "Any",
      bedsMax: "5+",
    });
    expect(data.length).toBe(getMockSearchProperties().length);
  });
});

describe("searchProperties (mock path) — soldWithin", () => {
  // Enable the dev/demo search_mock_data flag so searchProperties serves the
  // canonical mock dataset. With both flags off (production default) the action
  // returns [] and never fabricates listings for real users — preserving the
  // data-integrity rule.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("'all' returns all rows (mock has no LR data)", async () => {
    const { data } = await searchProperties({ soldWithin: "all" });
    expect(data.length).toBe(getMockSearchProperties().length);
  });

  it("'3m' returns empty (mock data has no last_sold_date)", async () => {
    const { data } = await searchProperties({ soldWithin: "3m" });
    expect(data.length).toBe(0);
  });
});

describe("searchProperties (mock path) — rental fields + listing type", () => {
  // Enable the dev/demo search_mock_data flag so searchProperties serves the
  // canonical mock dataset.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("listingType=rent returns only rent rows, with rental fields populated", async () => {
    const { data } = await searchProperties({ listingType: "rent" });
    const allMock = getMockSearchProperties();
    const expectedRentCount = allMock.filter((p) => p.listing_type === "rent").length;
    expect(data.length).toBe(expectedRentCount);
    expect(data.every((p) => p.listing_type === "rent")).toBe(true);
    expect(data.some((p) => p.furnishing != null)).toBe(true);
    expect(data.some((p) => p.let_agreed === true)).toBe(true);
  });

  it("listingType=sale returns only sale rows", async () => {
    const { data } = await searchProperties({ listingType: "sale" });
    const allMock = getMockSearchProperties();
    const expectedSaleCount = allMock.filter((p) => p.listing_type === "sale").length;
    expect(data.length).toBe(expectedSaleCount);
    expect(data.every((p) => p.listing_type === "sale")).toBe(true);
  });
});
