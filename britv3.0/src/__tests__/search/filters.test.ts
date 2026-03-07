import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";

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
