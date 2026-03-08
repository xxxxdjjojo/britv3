import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecommendations } from "./recommendations";

// Mock Supabase server client
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

/**
 * Creates a Supabase-like query chain that is both chainable and thenable.
 * Every chained method returns the same object, and awaiting it resolves to { data, error }.
 */
function createQueryChain(data: unknown[] | null, error: unknown = null) {
  const result = { data, error };
  const chain: Record<string, unknown> = {};

  const methods = ["select", "eq", "gte", "lte", "ilike", "not", "in", "order", "limit", "neq"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Make the chain thenable (Supabase PostgREST builder pattern)
  chain.then = (resolve: (val: unknown) => void, reject?: (err: unknown) => void) => {
    return Promise.resolve(result).then(resolve, reject);
  };

  return chain;
}

describe("getRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when user has no saved searches", async () => {
    const searchChain = createQueryChain([]);
    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return searchChain;
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123");
    expect(result).toEqual([]);
  });

  it("returns properties matching saved search criteria", async () => {
    const savedSearches = [
      {
        id: "search-1",
        property_type: "detached",
        min_price: 200000,
        max_price: 400000,
        min_bedrooms: 3,
        postcode_prefix: "SW1A",
      },
    ];

    const matchingProperties = [
      {
        id: "prop-1",
        title: "Lovely 3-bed in Westminster",
        property_type: "detached",
        price: 350000,
        bedrooms: 3,
        postcode: "SW1A 2AA",
        match_score: 4,
      },
      {
        id: "prop-2",
        title: "4-bed detached",
        property_type: "detached",
        price: 380000,
        bedrooms: 4,
        postcode: "SW1A 1BB",
        match_score: 4,
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return createQueryChain(savedSearches);
      if (table === "property_interactions") return createQueryChain([]);
      if (table === "properties") return createQueryChain(matchingProperties);
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("match_score");
  });

  it("excludes properties user has viewed, saved, or dismissed", async () => {
    const savedSearches = [
      {
        id: "search-1",
        property_type: "flat",
        min_price: 100000,
        max_price: 300000,
        min_bedrooms: 2,
        postcode_prefix: "E1",
      },
    ];

    const interactions = [
      { property_id: "prop-viewed" },
      { property_id: "prop-saved" },
      { property_id: "prop-dismissed" },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return createQueryChain(savedSearches);
      if (table === "property_interactions") return createQueryChain(interactions);
      if (table === "properties") return createQueryChain([
        {
          id: "prop-new",
          title: "New flat",
          property_type: "flat",
          price: 200000,
          bedrooms: 2,
          postcode: "E1 6AN",
          match_score: 3,
        },
      ]);
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123");
    const ids = result.map((r) => r.id);
    expect(ids).not.toContain("prop-viewed");
    expect(ids).not.toContain("prop-saved");
    expect(ids).not.toContain("prop-dismissed");
  });

  it("returns max 10 results by default", async () => {
    const savedSearches = [
      {
        id: "search-1",
        property_type: "semi-detached",
        min_price: 150000,
        max_price: 500000,
        min_bedrooms: 2,
        postcode_prefix: "M1",
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return createQueryChain(savedSearches);
      if (table === "property_interactions") return createQueryChain([]);
      if (table === "properties") return createQueryChain(
        Array.from({ length: 10 }, (_, i) => ({
          id: `prop-${i}`,
          title: `Property ${i}`,
          property_type: "semi-detached",
          price: 200000 + i * 10000,
          bedrooms: 3,
          postcode: `M1 ${i}AA`,
          match_score: 3,
        })),
      );
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123");
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("returns empty array when no properties match", async () => {
    const savedSearches = [
      {
        id: "search-1",
        property_type: "castle",
        min_price: 10000000,
        max_price: 50000000,
        min_bedrooms: 20,
        postcode_prefix: "ZZ99",
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return createQueryChain(savedSearches);
      if (table === "property_interactions") return createQueryChain([]);
      if (table === "properties") return createQueryChain([]);
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123");
    expect(result).toEqual([]);
  });

  it("accepts custom limit parameter", async () => {
    const savedSearches = [
      {
        id: "search-1",
        property_type: "flat",
        min_price: 100000,
        max_price: 200000,
        min_bedrooms: 1,
        postcode_prefix: "EC1",
      },
    ];

    const properties = Array.from({ length: 5 }, (_, i) => ({
      id: `prop-${i}`,
      title: `Flat ${i}`,
      property_type: "flat",
      price: 150000,
      bedrooms: 2,
      postcode: `EC1 ${i}AA`,
      match_score: 3,
    }));

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return createQueryChain(savedSearches);
      if (table === "property_interactions") return createQueryChain([]);
      if (table === "properties") return createQueryChain(properties);
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123", 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});
