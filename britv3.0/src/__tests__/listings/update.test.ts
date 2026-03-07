/**
 * Tests for listing update and deletion via listing-service.
 * Verifies ownership check, field updates, and soft delete.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockListing, createMockProperty } from "../fixtures/listings";

describe("updateListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function createUpdateMock(overrides?: {
    ownershipData?: unknown;
    propertyUpdateResult?: { data: unknown; error: unknown };
    listingUpdateResult?: { data: unknown; error: unknown };
  }) {
    const mockListing = createMockListing();
    const mockProperty = createMockProperty();

    // Ownership check chain
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: overrides?.ownershipData ?? {
          ...mockListing,
          property_id: mockProperty.id,
        },
        error: null,
      }),
    };

    // Property update chain
    const propertyUpdateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        overrides?.propertyUpdateResult ?? { data: mockProperty, error: null },
      ),
    };

    // Listing update chain
    const listingUpdateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        overrides?.listingUpdateResult ?? { data: mockListing, error: null },
      ),
    };

    let propertiesCalls = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") return ownershipChain;
      if (table === "properties") {
        propertiesCalls++;
        return propertiesCalls === 1
          ? propertyUpdateChain
          : propertyUpdateChain;
      }
      return ownershipChain;
    });

    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    return {
      supabase: { from, rpc } as unknown,
      from,
      rpc,
      ownershipChain,
      propertyUpdateChain,
      listingUpdateChain,
      mockListing,
      mockProperty,
    };
  }

  it("verifies ownership before updating", async () => {
    const { updateListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase, from, ownershipChain } = createUpdateMock();

    await updateListing(supabase as never, "user-001", "listing-001", {
      price: 400000,
    });

    expect(from).toHaveBeenCalledWith("listings");
    expect(ownershipChain.eq).toHaveBeenCalledWith("id", "listing-001");
    expect(ownershipChain.eq).toHaveBeenCalledWith("user_id", "user-001");
  });

  it("rejects update if user does not own listing", async () => {
    const { updateListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase } = createUpdateMock({
      ownershipData: null,
    });

    // When ownership returns null, the single() call indicates no match
    // We override to return null data
    const ownerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Row not found", code: "PGRST116" },
      }),
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") return ownerChain;
      return ownerChain;
    });

    const sb = { from: mockFrom, rpc: vi.fn() };

    await expect(
      updateListing(sb as never, "user-999", "listing-001", { price: 1 }),
    ).rejects.toThrow();
  });

  it("updates listing fields (price change triggers DB trigger)", async () => {
    const { updateListing } = await import(
      "@/services/listings/listing-service"
    );

    const mockListing = createMockListing();
    const mockProperty = createMockProperty();

    // Ownership chain
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockListing, property_id: mockProperty.id },
        error: null,
      }),
    };

    // Listing update chain
    const listingUpdateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockListing, price: 400000 },
        error: null,
      }),
    };

    let listingCallCount = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") {
        listingCallCount++;
        return listingCallCount === 1 ? ownershipChain : listingUpdateChain;
      }
      return ownershipChain;
    });

    const sb = { from, rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };

    const result = await updateListing(
      sb as never,
      "user-001",
      "listing-001",
      { price: 400000 },
    );

    expect(listingUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ price: 400000 }),
    );
    expect(result.listing.price).toBe(400000);
  });
});

describe("deleteListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("soft deletes by setting deleted_at", async () => {
    const { deleteListing } = await import(
      "@/services/listings/listing-service"
    );

    const mockListing = createMockListing();

    // Ownership chain
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockListing,
        error: null,
      }),
    };

    // Delete (update) chain
    const deleteChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockListing, deleted_at: new Date() },
        error: null,
      }),
    };

    let listingCallCount = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") {
        listingCallCount++;
        return listingCallCount === 1 ? ownershipChain : deleteChain;
      }
      return ownershipChain;
    });

    const sb = { from, rpc: vi.fn() };

    await deleteListing(sb as never, "user-001", "listing-001");

    expect(deleteChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      }),
    );
  });
});
