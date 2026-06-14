/**
 * Tests for planning permission status across the listing flow (TDD RED)
 *
 * Part A — listingFormSchema (not yet exported from ListingForm):
 *  - planning_permission_status is required
 *  - accepts "granted" | "pending" | "refused" | "none_known"
 *  - rejects unknown values ("approved")
 *
 * Part B — listing-service:
 *  - createListing forwards planning_permission_status to the properties
 *    insert payload (currently dropped by the PROPERTY_FIELDS allowlist)
 *  - publishing (updateListing with status: "active") rejects when the
 *    property's planning_permission_status is null (check does not exist yet)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockListing, createMockProperty } from "../fixtures/listings";

// Mock geocoding (same as create.test.ts)
vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({
    postcode: "SW1A 1AA",
    latitude: 51.5014,
    longitude: -0.1419,
    admin_district: "Westminster",
    region: "London",
  }),
}));

// ---------------------------------------------------------------------------
// Part A — form schema
// ---------------------------------------------------------------------------

/** Minimal value that satisfies every required field of the existing schema */
const VALID_FORM_VALUES = {
  listing_type: "sale",
  address_line1: "123 High Street",
  city: "London",
  postcode: "SW1A 1AA",
  property_type: "semi_detached",
  bedrooms: 3,
  bathrooms: 2,
  title: "Charming 3-bed semi-detached in Westminster",
  description: "A beautiful three-bedroom semi-detached house.",
  price: 350000,
};

describe("listingFormSchema planning_permission_status", () => {
  it("rejects a form value missing planning_permission_status with an issue on that path", async () => {
    // Arrange
    const { listingFormSchema } = await import(
      "@/components/listings/ListingForm"
    );
    expect(listingFormSchema).toBeDefined();

    // Act
    const result = listingFormSchema.safeParse(VALID_FORM_VALUES);

    // Assert
    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(
      issues.some(
        (issue: { path: (string | number)[] }) =>
          issue.path[0] === "planning_permission_status",
      ),
    ).toBe(true);
  });

  it.each(["granted", "pending", "refused", "none_known"])(
    "accepts planning_permission_status %s",
    async (status) => {
      // Arrange
      const { listingFormSchema } = await import(
        "@/components/listings/ListingForm"
      );
      expect(listingFormSchema).toBeDefined();

      // Act
      const result = listingFormSchema.safeParse({
        ...VALID_FORM_VALUES,
        planning_permission_status: status,
      });

      // Assert
      expect(result.success).toBe(true);
    },
  );

  it("rejects the invalid value 'approved'", async () => {
    // Arrange
    const { listingFormSchema } = await import(
      "@/components/listings/ListingForm"
    );
    expect(listingFormSchema).toBeDefined();

    // Act
    const result = listingFormSchema.safeParse({
      ...VALID_FORM_VALUES,
      planning_permission_status: "approved",
    });

    // Assert
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Part B — listing service
// ---------------------------------------------------------------------------

// Chainable Supabase mock for createListing (same shape as create.test.ts)
function createSupabaseMock() {
  const mockProperty = createMockProperty();
  const mockListing = createMockListing();

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

  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

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

describe("createListing planning_permission_status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes planning_permission_status in the properties insert payload", async () => {
    // Arrange
    const { createListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase, propertyChain } = createSupabaseMock();

    const input = {
      address_line1: "123 High Street",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "semi_detached",
      bedrooms: 3,
      bathrooms: 2,
      title: "Test property",
      description: "A test property",
      listing_type: "sale",
      price: 350000,
      planning_permission_status: "granted",
    };

    // Act
    await createListing(supabase as never, "user-001", input as never);

    // Assert — field must pass the PROPERTY_FIELDS allowlist
    expect(propertyChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        planning_permission_status: "granted",
      }),
    );
  });
});

describe("updateListing publish guard for planning_permission_status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  /** Build an updateListing mock whose owned property has the given status */
  function createPublishMock(planningStatus: string | null) {
    const mockProperty = createMockProperty({
      planning_permission_status:
        planningStatus as never,
    });
    const mockListing = createMockListing({ status: "draft" });

    // Ownership check chain (first from("listings") call)
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          ...mockListing,
          property_id: mockProperty.id,
          properties: mockProperty,
        },
        error: null,
      }),
    };

    // Listing update chain (second from("listings") call)
    const listingUpdateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockListing, status: "active" },
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

    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    return {
      supabase: { from, rpc } as unknown,
      listingUpdateChain,
    };
  }

  it("rejects publishing when the property's planning_permission_status is null", async () => {
    // Arrange
    const { updateListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase } = createPublishMock(null);

    // Act / Assert
    await expect(
      updateListing(supabase as never, "user-001", "listing-001", {
        status: "active",
      }),
    ).rejects.toThrow(/planning/i);
  });

  it("allows publishing when the property's planning_permission_status is set", async () => {
    // Arrange
    const { updateListing } = await import(
      "@/services/listings/listing-service"
    );
    const { supabase, listingUpdateChain } = createPublishMock("granted");

    // Act
    const result = await updateListing(
      supabase as never,
      "user-001",
      "listing-001",
      { status: "active" },
    );

    // Assert
    expect(listingUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
    expect(result.listing.status).toBe("active");
  });
});
