import { describe, it, expect, vi } from "vitest";
import { getNearbyMapListings } from "./nearby-map-listings";

// Real EWKB fixture from parse-coordinates.test.ts: lng -0.0776, lat 51.5232
const EWKB_HEX = "0101000020E6100000E86A2BF697DDB3BF34A2B437F8C24940";
const GEOJSON_POINT = { type: "Point", coordinates: [-0.0776, 51.5232] };

function mockSupabase(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "like", "gte", "lte", "neq", "limit"]) {
    builder[m] = vi.fn(() => builder);
  }
  // Make the builder awaitable, resolving to result
  (builder as { then: (resolve: (v: unknown) => void) => void }).then = (
    resolve,
  ) => resolve(result);
  return { from: vi.fn(() => builder) };
}

describe("getNearbyMapListings", () => {
  const baseParams = {
    propertyId: "prop-abc",
    postcodeDistrict: "TW7",
    listingType: "sale" as const,
    price: 450000,
  };

  it("maps EWKB-hex coordinates to {lat, lng} correctly", async () => {
    const supabase = mockSupabase({
      data: [
        {
          listing_id: "list-1",
          slug: "my-flat-tw7",
          price: 450000,
          coordinates: EWKB_HEX,
          listing_type: "sale",
        },
      ],
      error: null,
    });

    const result = await getNearbyMapListings({
      supabase: supabase as never,
      ...baseParams,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("list-1");
    expect(result[0].slug).toBe("my-flat-tw7");
    expect(result[0].lat).toBeCloseTo(51.5232, 3);
    expect(result[0].lng).toBeCloseTo(-0.0776, 3);
  });

  it("maps GeoJSON-Point coordinates to {lat, lng} correctly", async () => {
    const supabase = mockSupabase({
      data: [
        {
          listing_id: "list-2",
          slug: "another-flat",
          price: 480000,
          coordinates: GEOJSON_POINT,
          listing_type: "sale",
        },
      ],
      error: null,
    });

    const result = await getNearbyMapListings({
      supabase: supabase as never,
      ...baseParams,
    });

    expect(result).toHaveLength(1);
    expect(result[0].lat).toBeCloseTo(51.5232, 3);
    expect(result[0].lng).toBeCloseTo(-0.0776, 3);
  });

  it("drops rows with null or unparseable coordinates", async () => {
    const supabase = mockSupabase({
      data: [
        {
          listing_id: "list-good",
          slug: "good-flat",
          price: 450000,
          coordinates: EWKB_HEX,
          listing_type: "sale",
        },
        {
          listing_id: "list-null-coords",
          slug: "no-coords",
          price: 460000,
          coordinates: null,
          listing_type: "sale",
        },
        {
          listing_id: "list-bad-coords",
          slug: "bad-coords",
          price: 470000,
          coordinates: "not-valid-hex",
          listing_type: "sale",
        },
      ],
      error: null,
    });

    const result = await getNearbyMapListings({
      supabase: supabase as never,
      ...baseParams,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("list-good");
  });

  it("formats sale price as £450,000 (no division)", async () => {
    const supabase = mockSupabase({
      data: [
        {
          listing_id: "list-sale",
          slug: "sale-flat",
          price: 450000,
          coordinates: EWKB_HEX,
          listing_type: "sale",
        },
      ],
      error: null,
    });

    const result = await getNearbyMapListings({
      supabase: supabase as never,
      ...baseParams,
      listingType: "sale",
    });

    expect(result[0].priceLabel).toBe("£450,000");
  });

  it("formats rent price as £1,800 pcm (no division)", async () => {
    const supabase = mockSupabase({
      data: [
        {
          listing_id: "list-rent",
          slug: "rent-flat",
          price: 1800,
          coordinates: GEOJSON_POINT,
          listing_type: "rent",
        },
      ],
      error: null,
    });

    const result = await getNearbyMapListings({
      supabase: supabase as never,
      ...baseParams,
      listingType: "rent",
      price: 1800,
    });

    expect(result[0].priceLabel).toBe("£1,800 pcm");
  });

  it("returns [] and logs an error when supabase returns an error", async () => {
    const consoleSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const supabase = mockSupabase({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getNearbyMapListings({
      supabase: supabase as never,
      ...baseParams,
    });

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
