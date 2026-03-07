import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecommendations } from "./recommendations";

// Mock Supabase server client
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

function createQueryChain(data: unknown[] | null, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
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

    const searchChain = createQueryChain(savedSearches);
    const interactionChain = createQueryChain([]);
    const propertiesChain = createQueryChain(matchingProperties);

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return searchChain;
      if (table === "property_interactions") return interactionChain;
      if (table === "properties") return propertiesChain;
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

    const searchChain = createQueryChain(savedSearches);
    const interactionChain = createQueryChain(interactions);
    const propertiesChain = createQueryChain([
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

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return searchChain;
      if (table === "property_interactions") return interactionChain;
      if (table === "properties") return propertiesChain;
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123");
    // Should not contain viewed/saved/dismissed properties
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

    const searchChain = createQueryChain(savedSearches);
    const interactionChain = createQueryChain([]);
    const propertiesChain = createQueryChain(
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

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return searchChain;
      if (table === "property_interactions") return interactionChain;
      if (table === "properties") return propertiesChain;
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

    const searchChain = createQueryChain(savedSearches);
    const interactionChain = createQueryChain([]);
    const propertiesChain = createQueryChain([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return searchChain;
      if (table === "property_interactions") return interactionChain;
      if (table === "properties") return propertiesChain;
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

    const searchChain = createQueryChain(savedSearches);
    const interactionChain = createQueryChain([]);
    const propertiesChain = createQueryChain(properties);

    mockFrom.mockImplementation((table: string) => {
      if (table === "saved_searches") return searchChain;
      if (table === "property_interactions") return interactionChain;
      if (table === "properties") return propertiesChain;
      return createQueryChain([]);
    });

    const result = await getRecommendations("user-123", 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});
