import { describe, it, expect } from "vitest";
import { DETAIL_VIEWABLE_STATUSES, getPropertyBySlug } from "./property-detail-service";
import { Constants } from "@/types/database.types";

/**
 * Regression guard for the property-detail 404 incident (2026-06-19):
 * the listing query passed status "sold_stc", which is NOT a member of the
 * DB `listing_status` enum. PostgREST rejected the whole query (22P02), so
 * getPropertyBySlug returned null and EVERY property page rendered
 * "Property not found". The supabase client here is untyped, so nothing
 * caught it at compile time — hence this runtime test.
 */
describe("DETAIL_VIEWABLE_STATUSES", () => {
  const enumValues = Constants.public.Enums.listing_status;

  it("contains only values present in the DB listing_status enum", () => {
    for (const status of DETAIL_VIEWABLE_STATUSES) {
      expect(enumValues).toContain(status);
    }
  });

  it("never includes the non-existent 'sold_stc' value", () => {
    expect(DETAIL_VIEWABLE_STATUSES).not.toContain("sold_stc");
  });

  it("excludes draft and archived (not publicly viewable)", () => {
    expect(DETAIL_VIEWABLE_STATUSES).not.toContain("draft");
    expect(DETAIL_VIEWABLE_STATUSES).not.toContain("archived");
  });

  it("includes active so live listings resolve", () => {
    expect(DETAIL_VIEWABLE_STATUSES).toContain("active");
  });
});

describe("getPropertyBySlug (mock path)", () => {
  it("returns a deterministic viewCount — same slug yields same value twice", async () => {
    const a = await getPropertyBySlug("45-bermondsey-street-london-rent");
    const b = await getPropertyBySlug("45-bermondsey-street-london-rent");
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(Number.isFinite(a!.listing.viewCount)).toBe(true);
    expect(a!.listing.viewCount).toBe(b!.listing.viewCount);
  });

  it("known RENT slug yields populated rental fields", async () => {
    const result = await getPropertyBySlug("45-bermondsey-street-london-rent");
    expect(result).not.toBeNull();
    const { listing } = result!;
    expect(listing.listingType).toBe("rent");
    expect(listing.furnishing).toBe("furnished");
    expect(listing.depositScheme).toBe("DPS");
    expect(listing.depositAmount).toBeGreaterThan(0);
  });

  it("known SALE slug yields sale listing with null furnishing", async () => {
    const result = await getPropertyBySlug("12-kensington-gardens-london-sale");
    expect(result).not.toBeNull();
    expect(result!.listing.listingType).toBe("sale");
    expect(result!.listing.furnishing).toBeNull();
  });
});
