/**
 * Test 7: agent-analytics-service
 * getMarketAppraisalData() falls back gracefully when Land Registry returns 503
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

// Mock the land-registry module before importing the service
vi.mock("@/services/land-registry/land-registry", () => ({
  getPricePaidData: vi.fn(),
}));

import { getMarketAppraisalData } from "@/services/agent/agent-analytics-service";
import { getPricePaidData } from "@/services/land-registry/land-registry";

describe("getMarketAppraisalData — LR 503 fallback", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it("Test 7: sets lr_unavailable=true and sold_comparables=[] when LR throws", async () => {
    // Simulate Land Registry 503 / network error
    (getPricePaidData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Service Unavailable (503)"),
    );

    // Supabase returns empty active listings
    const queryBuilder = mockClient.from("agent_listings");
    (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      error: null,
    });
    // The service uses .select().ilike().eq().order().limit() — resolved via then()
    // Override the then handler to return empty active listings
    mockClient.from = vi.fn().mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) =>
          resolve({ data: [], error: null })
        ),
      };
    });

    const result = await getMarketAppraisalData(mockClient as never, "SW1A 1AA");

    expect(result.lr_unavailable).toBe(true);
    expect(result.sold_comparables).toEqual([]);
    // Function should NOT throw
    expect(result).toBeDefined();
  });

  it("Test 7b: returns LR data normally when Land Registry is available", async () => {
    const mockLrData = [
      {
        transaction_id: "tx-001",
        price: 450000,
        date_of_transfer: "2026-01-15",
        postcode: "SW1A 1AA",
        property_type: "F",
        new_build: "N",
        estate_type: "L",
        paon: "12",
        saon: "",
        street: "Whitehall",
        locality: "",
        town: "London",
        district: "Westminster",
        county: "Greater London",
        transaction_category: "A",
        record_status: "A",
      },
    ];

    (getPricePaidData as ReturnType<typeof vi.fn>).mockResolvedValue(mockLrData);

    mockClient.from = vi.fn().mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) =>
          resolve({ data: [], error: null })
        ),
      };
    });

    const result = await getMarketAppraisalData(mockClient as never, "SW1A 1AA");

    expect(result.lr_unavailable).toBeUndefined();
    expect(result.sold_comparables).toHaveLength(1);
    expect(result.sold_comparables[0].price).toBe(450000);
  });
});
