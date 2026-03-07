import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";

describe("search sorting", () => {
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

  it("sorts by price ascending", async () => {
    await buildSearchQuery(mockClient as never, { sort: "price_asc" });
    expect(mockBuilder.order).toHaveBeenCalledWith("price", { ascending: true });
  });

  it("sorts by price descending", async () => {
    await buildSearchQuery(mockClient as never, { sort: "price_desc" });
    expect(mockBuilder.order).toHaveBeenCalledWith("price", { ascending: false });
  });

  it("sorts by date descending (newest first)", async () => {
    await buildSearchQuery(mockClient as never, { sort: "date_desc" });
    expect(mockBuilder.order).toHaveBeenCalledWith("listed_date", { ascending: false });
  });

  it("sorts by date ascending (oldest first)", async () => {
    await buildSearchQuery(mockClient as never, { sort: "date_asc" });
    expect(mockBuilder.order).toHaveBeenCalledWith("listed_date", { ascending: true });
  });

  it("defaults to date descending when no sort specified", async () => {
    await buildSearchQuery(mockClient as never, {});
    expect(mockBuilder.order).toHaveBeenCalledWith("listed_date", { ascending: false });
  });
});
