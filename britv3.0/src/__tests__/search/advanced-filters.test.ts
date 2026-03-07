import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";

describe("search filters (advanced)", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let mockBuilder: ReturnType<ReturnType<typeof createMockSupabaseClient>["from"]>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    mockBuilder = mockClient.from("search_listings");

    (mockBuilder as Record<string, unknown>).then = vi.fn(
      (resolve: (v: unknown) => void) =>
        resolve({ data: MOCK_SEARCH_RESULTS, error: null, count: 5 }),
    );
  });

  it("applies epc_rating filter with .lte", async () => {
    await buildSearchQuery(mockClient as never, { epc_rating: "C" });
    expect(mockBuilder.lte).toHaveBeenCalledWith("epc_rating", "C");
  });

  it("applies new_build filter with .eq", async () => {
    await buildSearchQuery(mockClient as never, { new_build: true });
    expect(mockBuilder.eq).toHaveBeenCalledWith("new_build", true);
  });

  it("applies full-text search with .textSearch", async () => {
    await buildSearchQuery(mockClient as never, { q: "garden" });
    expect(mockBuilder.textSearch).toHaveBeenCalledWith(
      "description_tsv",
      "garden",
      expect.any(Object),
    );
  });

  it("applies amenities filter with .contains", async () => {
    await buildSearchQuery(mockClient as never, { amenities: ["garden", "parking"] });
    expect(mockBuilder.contains).toHaveBeenCalledWith("features", {
      garden: true,
      parking: true,
    });
  });

  it("applies max_bedrooms filter with .lte", async () => {
    await buildSearchQuery(mockClient as never, { max_bedrooms: 4 });
    expect(mockBuilder.lte).toHaveBeenCalledWith("bedrooms", 4);
  });

  it("applies min_bathrooms filter with .gte", async () => {
    await buildSearchQuery(mockClient as never, { min_bathrooms: 2 });
    expect(mockBuilder.gte).toHaveBeenCalledWith("bathrooms", 2);
  });
});
