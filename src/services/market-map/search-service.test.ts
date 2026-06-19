/**
 * Unit tests for the pure mapSearchRow helper and zod-adjacent edge cases.
 * No DB required — all tests operate on hand-built rows.
 */

import { describe, it, expect } from "vitest";
import { mapSearchRow } from "./search-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validRow(overrides: Partial<{
  id: string;
  name: string;
  type: string;
  geography_level: string;
  center: unknown;
  bbox: unknown;
  default_zoom: number;
}> = {}) {
  return {
    id: "E09000033",
    name: "Westminster",
    type: "local_authority",
    geography_level: "local_authority",
    center: [-0.1357, 51.4975],
    bbox: [-0.2091, 51.4656, -0.0640, 51.5308],
    default_zoom: 11,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("mapSearchRow", () => {
  it("maps a valid local_authority row to a DTO", () => {
    const dto = mapSearchRow(validRow());

    expect(dto).not.toBeNull();
    expect(dto?.id).toBe("E09000033");
    expect(dto?.name).toBe("Westminster");
    expect(dto?.geography_level).toBe("local_authority");
    expect(dto?.center).toEqual([-0.1357, 51.4975]);
    expect(dto?.bbox).toEqual([-0.2091, 51.4656, -0.064, 51.5308]);
    expect(dto?.default_zoom).toBe(11);
  });

  it("maps a postcode_district row correctly", () => {
    const dto = mapSearchRow(
      validRow({
        id: "SW1A",
        name: "SW1A",
        type: "postcode_district",
        geography_level: "postcode_district",
        center: [-0.1278, 51.5014],
        bbox: [-0.145, 51.490, -0.110, 51.510],
        default_zoom: 13,
      }),
    );

    expect(dto).not.toBeNull();
    expect(dto?.geography_level).toBe("postcode_district");
    expect(dto?.default_zoom).toBe(13);
  });

  it("maps a postcode_sector row correctly", () => {
    const dto = mapSearchRow(
      validRow({
        id: "SW1A 1",
        name: "SW1A 1",
        type: "postcode_sector",
        geography_level: "postcode_sector",
        center: [-0.1278, 51.5014],
        bbox: [-0.135, 51.498, -0.120, 51.505],
        default_zoom: 14,
      }),
    );

    expect(dto).not.toBeNull();
    expect(dto?.geography_level).toBe("postcode_sector");
    expect(dto?.default_zoom).toBe(14);
  });

  // -------------------------------------------------------------------------
  // Numeric coercion
  // -------------------------------------------------------------------------

  it("coerces string numbers in center/bbox (jsonb may parse as strings)", () => {
    const dto = mapSearchRow(
      validRow({
        center: ["-0.1357", "51.4975"],
        bbox: ["-0.2091", "51.4656", "-0.0640", "51.5308"],
      }),
    );

    expect(dto).not.toBeNull();
    expect(dto?.center[0]).toBeCloseTo(-0.1357);
    expect(dto?.center[1]).toBeCloseTo(51.4975);
  });

  // -------------------------------------------------------------------------
  // Malformed center → null (row skipped)
  // -------------------------------------------------------------------------

  it("returns null when center is null", () => {
    expect(mapSearchRow(validRow({ center: null }))).toBeNull();
  });

  it("returns null when center is not an array", () => {
    expect(mapSearchRow(validRow({ center: { lng: 0, lat: 0 } }))).toBeNull();
  });

  it("returns null when center has fewer than 2 elements", () => {
    expect(mapSearchRow(validRow({ center: [-0.1] }))).toBeNull();
  });

  it("returns null when center contains non-finite values", () => {
    expect(mapSearchRow(validRow({ center: [NaN, 51.5] }))).toBeNull();
    expect(mapSearchRow(validRow({ center: [Infinity, 51.5] }))).toBeNull();
    expect(mapSearchRow(validRow({ center: [-0.1, null] }))).toBeNull();
  });

  it("returns null when center contains non-numeric strings", () => {
    expect(mapSearchRow(validRow({ center: ["abc", 51.5] }))).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Malformed bbox → null (row skipped)
  // -------------------------------------------------------------------------

  it("returns null when bbox is null", () => {
    expect(mapSearchRow(validRow({ bbox: null }))).toBeNull();
  });

  it("returns null when bbox has fewer than 4 elements", () => {
    expect(mapSearchRow(validRow({ bbox: [-0.2, 51.4, -0.06] }))).toBeNull();
  });

  it("returns null when bbox contains non-finite values", () => {
    expect(
      mapSearchRow(validRow({ bbox: [NaN, 51.4, -0.06, 51.53] })),
    ).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Edge: extra elements in arrays are ignored
  // -------------------------------------------------------------------------

  it("accepts center with more than 2 elements (extra ignored)", () => {
    const dto = mapSearchRow(validRow({ center: [-0.1357, 51.4975, 100] }));
    expect(dto).not.toBeNull();
    expect(dto?.center).toEqual([-0.1357, 51.4975]);
  });

  it("accepts bbox with more than 4 elements (extra ignored)", () => {
    const dto = mapSearchRow(
      validRow({ bbox: [-0.2091, 51.4656, -0.064, 51.5308, 999] }),
    );
    expect(dto).not.toBeNull();
    expect(dto?.bbox).toEqual([-0.2091, 51.4656, -0.064, 51.5308]);
  });
});
