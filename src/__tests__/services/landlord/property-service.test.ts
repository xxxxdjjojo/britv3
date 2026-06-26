/**
 * Tests for createPortfolioProperty — the landlord "Add Property" service.
 * Guards against the original bug where the form inserted property columns
 * into the `listings` table with an invalid listing_type and no property_id.
 */
import { beforeEach, describe, it, expect, vi } from "vitest";
import { createPortfolioProperty } from "@/services/landlord/property-service";

type Captured = { table: string; payload: Record<string, unknown> };

function createSupabaseMock(captured: Captured[]) {
  return {
    from: vi.fn((table: string) => ({
      insert: vi.fn((payload: Record<string, unknown>) => {
        captured.push({ table, payload });
        const returnedId = table === "properties" ? "prop-1" : "listing-1";
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: returnedId }, error: null }),
          }),
        };
      }),
    })),
  };
}

const validInput = {
  address_line_1: "24 Maple Gardens",
  address_line_2: "Flat 2",
  city: "London",
  postcode: "SW1A 1AA",
  property_type: "flat" as const,
  bedrooms: 2,
  bathrooms: 1,
  monthly_rent: 2200,
};

describe("createPortfolioProperty", () => {
  let captured: Captured[];

  beforeEach(() => {
    captured = [];
  });

  it("returns the new property and listing ids", async () => {
    const supabase = createSupabaseMock(captured);
    const result = await createPortfolioProperty(supabase as never, "landlord-1", validInput);
    expect(result).toEqual({ propertyId: "prop-1", listingId: "listing-1" });
  });

  it("inserts address/type/bed/bath into the `properties` table (real columns)", async () => {
    const supabase = createSupabaseMock(captured);
    await createPortfolioProperty(supabase as never, "landlord-1", validInput);

    const prop = captured.find((c) => c.table === "properties");
    expect(prop).toBeDefined();
    expect(prop!.payload).toMatchObject({
      address_line1: "24 Maple Gardens", // NOTE: real column has no underscore before 1
      address_line2: "Flat 2",
      city: "London",
      postcode: "SW1A 1AA",
      property_type: "flat",
      bedrooms: 2,
      bathrooms: 1,
    });
    // NOT NULL columns that the original form never provided
    expect(prop!.payload.title).toBeTruthy();
    expect(prop!.payload.description).toBeTruthy();
  });

  it("inserts a `listings` row with property_id, the owner, and listing_type='rent'", async () => {
    const supabase = createSupabaseMock(captured);
    await createPortfolioProperty(supabase as never, "landlord-1", validInput);

    const listing = captured.find((c) => c.table === "listings");
    expect(listing).toBeDefined();
    expect(listing!.payload).toMatchObject({
      property_id: "prop-1",
      user_id: "landlord-1",
      listing_type: "rent", // portfolio RPC filters on this exact value
    });
    // price is NOT NULL on listings — must always be set
    expect(listing!.payload.price).toBe(2200);
    // rent_frequency must satisfy listings_rent_frequency_check + valid_rent_freq
    expect(["weekly", "monthly", "yearly"]).toContain(listing!.payload.rent_frequency);
  });

  it("defaults listing price to 0 when no rent is given (price is NOT NULL)", async () => {
    const supabase = createSupabaseMock(captured);
    const { monthly_rent: _omit, ...noRent } = validInput;
    await createPortfolioProperty(supabase as never, "landlord-1", noRent);

    const listing = captured.find((c) => c.table === "listings");
    expect(listing!.payload.price).toBe(0);
  });

  it("never writes property columns onto the listings table (the original bug)", async () => {
    const supabase = createSupabaseMock(captured);
    await createPortfolioProperty(supabase as never, "landlord-1", validInput);

    const listing = captured.find((c) => c.table === "listings");
    expect(listing!.payload).not.toHaveProperty("address_line_1");
    expect(listing!.payload).not.toHaveProperty("city");
    expect(listing!.payload).not.toHaveProperty("bedrooms");
  });
});
