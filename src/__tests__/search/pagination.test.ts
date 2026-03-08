import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";

describe("search pagination (cursor-based)", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let mockBuilder: ReturnType<ReturnType<typeof createMockSupabaseClient>["from"]>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    mockBuilder = mockClient.from("search_listings");

    (mockBuilder as Record<string, unknown>).then = vi.fn(
      (resolve: (v: unknown) => void) =>
        resolve({ data: MOCK_SEARCH_RESULTS, error: null, count: 42 }),
    );
  });

  it("applies cursor with .gt on listing_id", async () => {
    await buildSearchQuery(mockClient as never, {
      cursor: "listing-005",
      per_page: 20,
    });
    expect(mockBuilder.gt).toHaveBeenCalledWith("listing_id", "listing-005");
  });

  it("applies per_page with .limit", async () => {
    await buildSearchQuery(mockClient as never, { per_page: 20 });
    expect(mockBuilder.limit).toHaveBeenCalledWith(20);
  });

  it("defaults per_page to 20", async () => {
    await buildSearchQuery(mockClient as never, {});
    expect(mockBuilder.limit).toHaveBeenCalledWith(20);
  });

  it("returns cursor as last item listing_id", async () => {
    const result = await buildSearchQuery(mockClient as never, {});
    expect(result.cursor).toBe("listing-005");
  });

  it("returns null cursor when no results", async () => {
    (mockBuilder as Record<string, unknown>).then = vi.fn(
      (resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 0 }),
    );
    const result = await buildSearchQuery(mockClient as never, {});
    expect(result.cursor).toBeNull();
  });

  it("returns count from query result", async () => {
    const result = await buildSearchQuery(mockClient as never, {});
    expect(result.count).toBe(42);
  });
});
