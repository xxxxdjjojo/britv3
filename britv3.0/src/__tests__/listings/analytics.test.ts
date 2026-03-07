/**
 * Tests for listing analytics retrieval and view count increment.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getListingAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns view_count, favorite_count, enquiry_count", async () => {
    const { getListingAnalytics } = await import(
      "@/services/listings/listing-service"
    );

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { view_count: 42, favorite_count: 5, enquiry_count: 3 },
        error: null,
      }),
    };

    const from = vi.fn().mockReturnValue(chain);
    const sb = { from };

    const result = await getListingAnalytics(sb as never, "listing-001");

    expect(from).toHaveBeenCalledWith("listings");
    expect(chain.select).toHaveBeenCalledWith(
      "view_count, favorite_count, enquiry_count",
    );
    expect(chain.eq).toHaveBeenCalledWith("id", "listing-001");
    expect(result).toEqual({
      view_count: 42,
      favorite_count: 5,
      enquiry_count: 3,
    });
  });
});

describe("incrementViewCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls RPC to increment view count", async () => {
    const { incrementViewCount } = await import(
      "@/services/listings/listing-service"
    );

    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const sb = { rpc };

    await incrementViewCount(sb as never, "listing-001");

    expect(rpc).toHaveBeenCalledWith("increment_listing_view_count", {
      p_listing_id: "listing-001",
    });
  });
});
