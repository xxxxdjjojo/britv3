/**
 * Tests for listing creation via listing-service.
 * Verifies property + listing insertion, geocoding, coordinate storage, and validation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockProperty, createMockListing } from "../fixtures/listings";

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

// Build a chainable Supabase mock
function createSupabaseMock(overrides?: {
  propertyInsertResult?: { data: unknown; error: unknown };
  listingInsertResult?: { data: unknown; error: unknown };
  rpcResult?: { data: unknown; error: unknown };
}) {
  const mockProperty = createMockProperty();
  const mockListing = createMockListing();

  const propertyChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      overrides?.propertyInsertResult ?? { data: mockProperty, error: null }
    ),
  };

  const listingChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      overrides?.listingInsertResult ?? { data: mockListing, error: null }
    ),
  };

  const rpc = vi.fn().mockResolvedValue(
    overrides?.rpcResult ?? { data: null, error: null }
  );

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "properties") return propertyChain;
    if (table === "listings") return listingChain;
    return propertyChain;
  });

  return {
    supabase: { from, rpc } as unknown,
    from,
    rpc,
    propertyChain,
    listingChain,
    mockProperty,
    mockListing,
  };
}

describe("createListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts into properties table then listings table", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase, from, propertyChain, listingChain, mockProperty } =
      createSupabaseMock();

    const input = {
      address_line1: "123 High Street",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "semi_detached" as const,
      bedrooms: 3,
      bathrooms: 2,
      title: "Test property",
      description: "A test property",
      listing_type: "sale" as const,
      price: 350000,
    };

    await createListing(supabase as never, "user-001", input);

    // Should call from("properties") with insert
    expect(from).toHaveBeenCalledWith("properties");
    expect(propertyChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        address_line1: "123 High Street",
        city: "London",
        postcode: "SW1A 1AA",
        property_type: "semi_detached",
        bedrooms: 3,
        bathrooms: 2,
      }),
    );

    // Should call from("listings") with insert
    expect(from).toHaveBeenCalledWith("listings");
    expect(listingChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        property_id: mockProperty.id,
        user_id: "user-001",
        listing_type: "sale",
        price: 350000,
        status: "draft",
      }),
    );
  });

  it("geocodes postcode and stores coordinates via RPC", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );
    const { geocodePostcode } = await import(
      "@/services/geocoding/postcodes-io"
    );
    const { supabase, rpc, mockProperty } = createSupabaseMock();

    await createListing(supabase as never, "user-001", {
      address_line1: "123 High Street",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "semi_detached" as const,
      bedrooms: 3,
      bathrooms: 2,
      title: "Test",
      description: "Test",
      listing_type: "sale" as const,
      price: 350000,
    });

    expect(geocodePostcode).toHaveBeenCalledWith("SW1A 1AA");
    expect(rpc).toHaveBeenCalledWith("set_property_coordinates", {
      p_property_id: mockProperty.id,
      p_lng: -0.1419,
      p_lat: 51.5014,
    });
  });

  it("requires rent_frequency for rent listings", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase } = createSupabaseMock();

    await expect(
      createListing(supabase as never, "user-001", {
        address_line1: "123 High Street",
        city: "London",
        postcode: "SW1A 1AA",
        property_type: "flat" as const,
        bedrooms: 2,
        bathrooms: 1,
        title: "Test flat",
        description: "Test",
        listing_type: "rent" as const,
        price: 1500,
        // No rent_frequency
      }),
    ).rejects.toThrow("rent_frequency");
  });

  it("throws on property insert error", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase } = createSupabaseMock({
      propertyInsertResult: {
        data: null,
        error: { message: "Duplicate address" },
      },
    });

    await expect(
      createListing(supabase as never, "user-001", {
        address_line1: "123 High Street",
        city: "London",
        postcode: "SW1A 1AA",
        property_type: "semi_detached" as const,
        bedrooms: 3,
        bathrooms: 2,
        title: "Test",
        description: "Test",
        listing_type: "sale" as const,
        price: 350000,
      }),
    ).rejects.toThrow("Duplicate address");
  });

  it("returns the created listing with property data", async () => {
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase, mockProperty, mockListing } = createSupabaseMock();

    const result = await createListing(supabase as never, "user-001", {
      address_line1: "123 High Street",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "semi_detached" as const,
      bedrooms: 3,
      bathrooms: 2,
      title: "Test",
      description: "Test",
      listing_type: "sale" as const,
      price: 350000,
    });

    expect(result).toEqual(
      expect.objectContaining({
        listing: mockListing,
        property: mockProperty,
      }),
    );
  });
});
