/**
 * Tests for pricing qualifiers and rent frequency in listings.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockListing, createMockProperty } from "../fixtures/listings";

// Mock geocoding
vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({
    postcode: "SW1A 1AA",
    latitude: 51.5014,
    longitude: -0.1419,
    admin_district: "Westminster",
    region: "London",
  }),
}));

describe("pricing qualifiers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores and returns price_qualifier on creation", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );

    const mockProperty = createMockProperty();
    const mockListing = createMockListing({
      price_qualifier: "offers_over",
    });

    const propertyChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProperty, error: null }),
    };

    const listingChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockListing, error: null }),
    };

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "properties") return propertyChain;
      if (table === "listings") return listingChain;
      return propertyChain;
    });

    const sb = { from, rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };

    const result = await createListing(sb as never, "user-001", {
      address_line1: "1 Test St",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "detached" as const,
      bedrooms: 4,
      bathrooms: 3,
      title: "Test",
      description: "Test",
      listing_type: "sale" as const,
      price: 500000,
      price_qualifier: "offers_over" as const,
    });

    expect(listingChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        price_qualifier: "offers_over",
      }),
    );
    expect(result.listing.price_qualifier).toBe("offers_over");
  });

  it("includes rent_frequency for rental listings", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );

    const mockProperty = createMockProperty();
    const mockListing = createMockListing({
      listing_type: "rent",
      price: 1500,
      rent_frequency: "monthly",
    });

    const propertyChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProperty, error: null }),
    };

    const listingChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockListing, error: null }),
    };

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "properties") return propertyChain;
      if (table === "listings") return listingChain;
      return propertyChain;
    });

    const sb = { from, rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };

    const result = await createListing(sb as never, "user-001", {
      address_line1: "1 Test St",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "flat" as const,
      bedrooms: 2,
      bathrooms: 1,
      title: "Test flat",
      description: "Test",
      listing_type: "rent" as const,
      price: 1500,
      rent_frequency: "monthly" as const,
    });

    expect(listingChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rent_frequency: "monthly",
      }),
    );
    expect(result.listing.rent_frequency).toBe("monthly");
  });
});
