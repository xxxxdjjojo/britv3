/**
 * Tests for micro-area-service.ts — pure buildMicroAreaCollection function.
 *
 * We build MicroAreaCell fixtures directly (no DB calls) to test the pure
 * transformation: pence→pounds, domain computation, colour assignment,
 * polygon geometry construction, and metadata fields.
 */

import { describe, it, expect } from "vitest";
import { latLngToCell, cellToBoundary, cellToLatLng } from "h3-js";
import { buildMicroAreaCollection } from "./micro-area-service";
import type { MicroAreaCell } from "@/lib/market-map/street";
import type { MarketMapFilters } from "./types";
import { INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_FILTERS: MarketMapFilters = {
  geographyLevel: "street",
  propertyType: "all",
  fromDate: "2023-01-01",
  toDate: "2025-12-31",
  scaleMode: "local",
  bbox: [-0.15, 51.49, -0.09, 51.52],
};

/** Build a MicroAreaCell from a real H3 index at res 9. */
function makeCell(
  lat: number,
  lng: number,
  price_pence: number,
  count: number,
  overrides?: Partial<MicroAreaCell>,
): MicroAreaCell {
  const h3Index = latLngToCell(lat, lng, 9);
  const rawBoundary = cellToBoundary(h3Index, true) as [number, number][];
  const [cLat, cLng] = cellToLatLng(h3Index);
  return {
    h3Index,
    median_price_pence: price_pence,
    p10_price_pence: Math.round(price_pence * 0.8),
    p90_price_pence: Math.round(price_pence * 1.2),
    transaction_count: count,
    latest_transaction_date: "2024-06-01",
    boundary: rawBoundary,
    centroid: [cLng, cLat],
    ...overrides,
  };
}

// Two well-separated London coords — different h3 cells at res 9.
const CELL_1 = makeCell(51.507, -0.127, 35_000_000, 10); // £350,000 median, 10 txns
const CELL_2 = makeCell(51.515, -0.090, 50_000_000, 20); // £500,000 median, 20 txns
const CELL_INSUFFICIENT = makeCell(51.52, -0.10, 28_000_000, 3); // 3 txns → grey

// ---------------------------------------------------------------------------
// buildMicroAreaCollection
// ---------------------------------------------------------------------------

describe("buildMicroAreaCollection", () => {
  it("returns an empty FeatureCollection for empty cells array", () => {
    const result = buildMicroAreaCollection([], BASE_FILTERS);
    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(0);
  });

  it("produces one Feature per cell", () => {
    const result = buildMicroAreaCollection([CELL_1, CELL_2], BASE_FILTERS);
    expect(result.features).toHaveLength(2);
  });

  it("each Feature has geometry type Polygon", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.features[0].geometry.type).toBe("Polygon");
  });

  it("Polygon coordinates ring is closed (first === last vertex)", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    const ring = result.features[0].geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("Polygon ring has at least 7 vertices (6 hex sides + closing)", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    const ring = result.features[0].geometry.coordinates[0];
    expect(ring.length).toBeGreaterThanOrEqual(7);
  });

  it("converts median price from pence to pounds", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    // CELL_1: 35_000_000 pence = £350,000
    expect(result.features[0].properties.median_price).toBe(350_000);
  });

  it("converts p10 and p90 from pence to pounds", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    const props = result.features[0].properties;
    expect(props.p10_price).toBe(Math.round(CELL_1.p10_price_pence / 100));
    expect(props.p90_price).toBe(Math.round(CELL_1.p90_price_pence / 100));
  });

  it("sets area_id to the h3Index", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.features[0].properties.area_id).toBe(CELL_1.h3Index);
  });

  it("sets geography_level to 'street'", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.features[0].properties.geography_level).toBe("street");
  });

  it("area_name is a non-empty string containing the h3Index suffix", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    const name = result.features[0].properties.area_name;
    expect(typeof name).toBe("string");
    expect(name).toBeTruthy();
    expect(name).toContain(CELL_1.h3Index.slice(-7));
  });

  it("greyes out cells with transaction_count < 5", () => {
    const result = buildMicroAreaCollection([CELL_INSUFFICIENT], BASE_FILTERS);
    const props = result.features[0].properties;
    expect(props.fill_colour).toBe(INSUFFICIENT_COLOUR);
    expect(props.colour_bucket).toBeNull();
    expect(props.confidence).toBe("Insufficient");
  });

  it("assigns a colour bucket to eligible cells (count >= 5)", () => {
    const result = buildMicroAreaCollection([CELL_1, CELL_2], BASE_FILTERS);
    for (const f of result.features) {
      expect(f.properties.colour_bucket).not.toBeNull();
      expect(f.properties.fill_colour).not.toBe(INSUFFICIENT_COLOUR);
    }
  });

  it("lower-price cell gets a lower bucket than higher-price cell", () => {
    const result = buildMicroAreaCollection([CELL_1, CELL_2], BASE_FILTERS);
    const byId = Object.fromEntries(
      result.features.map((f) => [f.properties.area_id, f.properties]),
    );
    const bucket1 = byId[CELL_1.h3Index].colour_bucket!;
    const bucket2 = byId[CELL_2.h3Index].colour_bucket!;
    // CELL_1 cheaper → lower bucket number
    expect(bucket1).toBeLessThan(bucket2);
  });

  it("metadata carries band_label: 'micro-area sold-price band'", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.metadata.band_label).toBe("micro-area sold-price band");
  });

  it("metadata does not say '£/m²' or 'valuation' or 'street valuation'", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    const metaStr = JSON.stringify(result.metadata);
    expect(metaStr).not.toContain("£/m²");
    expect(metaStr).not.toContain("valuation");
  });

  it("metadata sqm_available is false", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.metadata.sqm_available).toBe(false);
  });

  it("metadata scale_mode matches filter", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.metadata.scale_mode).toBe(BASE_FILTERS.scaleMode);
  });

  it("properties transaction_count and latest_transaction_date match cell", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    const props = result.features[0].properties;
    expect(props.transaction_count).toBe(CELL_1.transaction_count);
    expect(props.latest_transaction_date).toBe(CELL_1.latest_transaction_date);
  });

  it("uses nationalDomain when provided instead of computing local domain", () => {
    // With a very high national domain, CELL_1 (£350k) should get bucket 1.
    const highDomain = { lo: 300_000, hi: 10_000_000 };
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS, highDomain);
    expect(result.features[0].properties.colour_bucket).toBe(1);
  });

  it("mixes eligible and insufficient cells correctly", () => {
    const result = buildMicroAreaCollection(
      [CELL_1, CELL_INSUFFICIENT],
      BASE_FILTERS,
    );
    const props = result.features.map((f) => f.properties);
    const eligible = props.filter((p) => p.transaction_count >= 5);
    const insufficient = props.filter((p) => p.transaction_count < 5);
    expect(eligible.every((p) => p.fill_colour !== INSUFFICIENT_COLOUR)).toBe(true);
    expect(insufficient.every((p) => p.fill_colour === INSUFFICIENT_COLOUR)).toBe(true);
  });

  it("property_type_mix is an empty object (not computed at cell level)", () => {
    const result = buildMicroAreaCollection([CELL_1], BASE_FILTERS);
    expect(result.features[0].properties.property_type_mix).toEqual({});
  });
});
