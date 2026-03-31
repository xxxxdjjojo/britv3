/**
 * TDD tests for getLocalComparables — fetches PPD comparable sales
 * from the local price_paid_transactions table in Supabase.
 *
 * This tests the future service function that queries our own PPD data
 * (as opposed to the live Land Registry API in land-registry-service.ts).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import type { LandRegistryComparable } from "@/services/properties/land-registry-service";

// ---------------------------------------------------------------------------
// Mock Supabase server client
// ---------------------------------------------------------------------------

const mockClient = createMockSupabaseClient();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockClient),
}));

// ---------------------------------------------------------------------------
// Import service under test (after mocks)
// ---------------------------------------------------------------------------

import { getLocalComparables } from "@/services/areas/sold-prices-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeComparableRow(overrides: Partial<LandRegistryComparable> = {}): LandRegistryComparable {
  return {
    address: "14 South Street, Isleworth",
    price: 485000,
    date: "2026-01-15",
    property_type: "Terraced",
    new_build: false,
    tenure: "Freehold",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown; error: unknown };

function configureFromChain(result: ChainResult) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: ChainResult) => void) => resolve(result)),
  };
  mockClient.from.mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getLocalComparables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Shape validation
  // -----------------------------------------------------------------------

  it("returns LandRegistryComparable[] with correct shape", async () => {
    const rows = [
      makeComparableRow(),
      makeComparableRow({ address: "16 South Street, Isleworth", price: 495000 }),
    ];
    configureFromChain({ data: rows, error: null });

    const result = await getLocalComparables("TW7 7BG");

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);

    const first = result![0];
    expect(first).toHaveProperty("address");
    expect(first).toHaveProperty("price");
    expect(first).toHaveProperty("date");
    expect(first).toHaveProperty("property_type");
    expect(first).toHaveProperty("new_build");
    expect(first).toHaveProperty("tenure");

    expect(typeof first.address).toBe("string");
    expect(typeof first.price).toBe("number");
    expect(typeof first.date).toBe("string");
    expect(typeof first.new_build).toBe("boolean");
  });

  // -----------------------------------------------------------------------
  // Empty postcode
  // -----------------------------------------------------------------------

  it("returns null for an empty postcode", async () => {
    const result = await getLocalComparables("");

    expect(result).toBeNull();
    // Should not query the database
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // No results
  // -----------------------------------------------------------------------

  it("returns empty array when no comparable sales found", async () => {
    configureFromChain({ data: [], error: null });

    const result = await getLocalComparables("XX99 9XX");

    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // Limit parameter
  // -----------------------------------------------------------------------

  it("respects the limit parameter", async () => {
    const rows = [
      makeComparableRow({ address: "1 Test Road" }),
      makeComparableRow({ address: "2 Test Road" }),
      makeComparableRow({ address: "3 Test Road" }),
    ];
    const chain = configureFromChain({ data: rows, error: null });

    await getLocalComparables("TW7 7BG", undefined, 5);

    // The chain's limit method should have been called with the limit value
    expect(chain.limit).toHaveBeenCalledWith(5);
  });

  // -----------------------------------------------------------------------
  // Property type filter
  // -----------------------------------------------------------------------

  it("filters by property type when provided", async () => {
    const rows = [
      makeComparableRow({ property_type: "Flat/Maisonette" }),
    ];
    const chain = configureFromChain({ data: rows, error: null });

    await getLocalComparables("TW7 7BG", "F");

    // Should have filtered by property type
    expect(chain.eq).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Default limit
  // -----------------------------------------------------------------------

  it("applies a default limit when none is specified", async () => {
    const chain = configureFromChain({ data: [], error: null });

    await getLocalComparables("TW7 7BG");

    // Should have called limit with a default (e.g. 20)
    expect(chain.limit).toHaveBeenCalled();
  });
});
