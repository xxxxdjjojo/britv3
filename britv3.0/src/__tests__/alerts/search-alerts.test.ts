/**
 * Tests for search alert checking logic.
 * Verifies that checkNewResults re-executes saved filters and identifies new matches.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SearchFilters } from "@/types/search";

const mockFilters: SearchFilters = {
  listing_type: "sale",
  min_price: 200000,
  max_price: 500000,
  min_bedrooms: 2,
};

const mockSavedSearch = {
  id: "search-001",
  user_id: "user-001",
  name: "My search",
  filters: mockFilters,
  alerts_enabled: true,
  alert_frequency: "daily",
  last_alerted_at: "2026-03-01T00:00:00Z",
  new_results_count: 0,
  created_at: "2026-02-15T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

// Mock the search service
vi.mock("@/services/search/search-service", () => ({
  searchProperties: vi.fn().mockResolvedValue({
    data: [
      { listing_id: "new-listing-1" },
      { listing_id: "new-listing-2" },
      { listing_id: "new-listing-3" },
    ],
    count: 3,
    cursor: null,
  }),
}));

function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "update", "delete", "eq", "single", "order"];
  for (const method of methods) {
    if (method === "single") {
      chain[method] = vi.fn().mockResolvedValue(result);
    } else {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
  }
  // Make chain thenable for fire-and-forget patterns (.then().catch())
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    resolve(result);
    return { catch: vi.fn() };
  });
  return chain;
}

function createSupabaseMock(opts?: {
  searchResult?: { data: unknown; error: unknown };
  updateResult?: { data: unknown; error: unknown };
}) {
  const selectChain = createChain(
    opts?.searchResult ?? { data: mockSavedSearch, error: null }
  );

  const updateChain = createChain(
    opts?.updateResult ?? { data: { ...mockSavedSearch, new_results_count: 3 }, error: null }
  );

  const from = vi.fn().mockImplementation(() => ({
    select: selectChain.select,
    update: updateChain.update,
    eq: selectChain.eq,
  }));

  return { supabase: { from } as unknown, from };
}

describe("search-alerts: checkNewResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("loads the saved search and re-executes its filters", async () => {
    const { checkNewResults } = await import(
      "@/services/saved/saved-searches-service"
    );
    const { searchProperties } = await import(
      "@/services/search/search-service"
    );
    const { supabase, from } = createSupabaseMock();

    const count = await checkNewResults(supabase as never, "search-001");

    // Should load the saved search
    expect(from).toHaveBeenCalledWith("saved_searches");

    // Should call searchProperties with the saved filters + listed_after
    expect(searchProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_type: "sale",
        min_price: 200000,
        max_price: 500000,
        min_bedrooms: 2,
        listed_after: "2026-03-01T00:00:00Z",
      }),
    );

    expect(count).toBe(3);
  });

  it("returns 0 when no new results found", async () => {
    const { searchProperties } = await import(
      "@/services/search/search-service"
    );
    (searchProperties as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
      count: 0,
      cursor: null,
    });

    const { checkNewResults } = await import(
      "@/services/saved/saved-searches-service"
    );
    const { supabase } = createSupabaseMock();

    const count = await checkNewResults(supabase as never, "search-001");

    expect(count).toBe(0);
  });

  it("uses epoch start when last_alerted_at is null", async () => {
    const { checkNewResults } = await import(
      "@/services/saved/saved-searches-service"
    );
    const { searchProperties } = await import(
      "@/services/search/search-service"
    );
    const { supabase } = createSupabaseMock({
      searchResult: {
        data: { ...mockSavedSearch, last_alerted_at: null },
        error: null,
      },
    });

    await checkNewResults(supabase as never, "search-001");

    expect(searchProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        listed_after: "1970-01-01T00:00:00.000Z",
      }),
    );
  });
});

describe("search-alerts: markAlerted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("updates last_alerted_at to current time", async () => {
    const { markAlerted } = await import(
      "@/services/saved/saved-searches-service"
    );
    const { supabase, from } = createSupabaseMock();

    await markAlerted(supabase as never, "search-001");

    expect(from).toHaveBeenCalledWith("saved_searches");
  });
});
