import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { MOCK_SEARCH_RESULTS } from "../fixtures/search-results";
import { buildSearchQuery } from "@/lib/search/query-builder";

describe("location-search (radius queries)", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("uses RPC search_listings_by_radius when lat/lng provided", async () => {
    const rpcBuilder = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: MOCK_SEARCH_RESULTS.slice(0, 2), error: null, count: 2 }),
      ),
    };
    mockClient.rpc.mockReturnValue(rpcBuilder);

    const result = await buildSearchQuery(mockClient as never, {
      lat: 51.501,
      lng: -0.141,
      radius: 5,
      listing_type: "sale",
    });

    expect(mockClient.rpc).toHaveBeenCalledWith(
      "search_listings_by_radius",
      expect.objectContaining({
        center_lat: 51.501,
        center_lng: -0.141,
      }),
    );
    expect(result.data).toHaveLength(2);
  });

  it("converts radius from miles to meters (1 mile = 1609.34m)", async () => {
    const rpcBuilder = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 0 }),
      ),
    };
    mockClient.rpc.mockReturnValue(rpcBuilder);

    await buildSearchQuery(mockClient as never, {
      lat: 51.501,
      lng: -0.141,
      radius: 10,
    });

    expect(mockClient.rpc).toHaveBeenCalledWith(
      "search_listings_by_radius",
      expect.objectContaining({
        radius_meters: 10 * 1609.34,
      }),
    );
  });

  it("defaults radius to 5 miles when not specified", async () => {
    const rpcBuilder = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 0 }),
      ),
    };
    mockClient.rpc.mockReturnValue(rpcBuilder);

    await buildSearchQuery(mockClient as never, {
      lat: 51.501,
      lng: -0.141,
    });

    expect(mockClient.rpc).toHaveBeenCalledWith(
      "search_listings_by_radius",
      expect.objectContaining({
        radius_meters: 5 * 1609.34,
      }),
    );
  });
});
