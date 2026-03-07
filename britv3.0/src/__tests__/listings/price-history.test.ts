/**
 * Tests for price history retrieval via listing-service.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getPriceHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns chronological price changes for a listing", async () => {
    const { getPriceHistory } = await import(
      "@/services/listings/listing-service"
    );

    const mockHistory = [
      {
        id: "ph-1",
        listing_id: "listing-001",
        old_price: 350000,
        new_price: 325000,
        changed_at: "2026-03-05T10:00:00Z",
        changed_by: "user-001",
      },
      {
        id: "ph-2",
        listing_id: "listing-001",
        old_price: 325000,
        new_price: 300000,
        changed_at: "2026-03-06T10:00:00Z",
        changed_by: "user-001",
      },
    ];

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
    };

    const from = vi.fn().mockReturnValue(chain);
    const sb = { from };

    const result = await getPriceHistory(sb as never, "listing-001");

    expect(from).toHaveBeenCalledWith("price_history");
    expect(chain.eq).toHaveBeenCalledWith("listing_id", "listing-001");
    expect(chain.order).toHaveBeenCalledWith("changed_at", {
      ascending: false,
    });
    expect(result).toHaveLength(2);
    expect(result[0].old_price).toBe(350000);
    expect(result[1].new_price).toBe(300000);
  });

  it("returns empty array when no price history exists", async () => {
    const { getPriceHistory } = await import(
      "@/services/listings/listing-service"
    );

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const from = vi.fn().mockReturnValue(chain);
    const sb = { from };

    const result = await getPriceHistory(sb as never, "listing-001");
    expect(result).toEqual([]);
  });
});
