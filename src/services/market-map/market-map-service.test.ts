/**
 * Unit tests for buildFeatureCollection — the pure transformation at the core of
 * the market-map service layer.
 *
 * No database, no network. All rows are hand-built to test specific cases.
 */

import { describe, it, expect } from "vitest";
import { buildFeatureCollection } from "./market-map-service";
import { INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
import type { MarketMapFilters } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid row with sensible defaults.  Override fields per test. */
function makeRow(
  overrides: Partial<{
    area_id: string;
    area_name: string | null;
    geography_level: string;
    median_price_pence: number;
    p10_price_pence: number;
    p90_price_pence: number;
    transaction_count: number;
    latest_transaction_date: string | null;
    property_type_mix: Record<string, number> | null;
    geojson: string | null;
  }>,
) {
  return {
    area_id: "E09000001",
    area_name: "Test Area",
    geography_level: "local_authority",
    median_price_pence: 35_000_000, // £350,000
    p10_price_pence: 20_000_000,    // £200,000
    p90_price_pence: 60_000_000,    // £600,000
    transaction_count: 50,
    latest_transaction_date: "2025-06-01",
    property_type_mix: { detached: 20, terraced: 30 } as Record<string, number> | null,
    geojson: JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }),
    ...overrides,
  };
}

/** Minimal filters covering the local scale mode. */
const LOCAL_FILTERS: MarketMapFilters = {
  geographyLevel: "local_authority",
  propertyType: "all",
  fromDate: "2022-01-01",
  toDate: "2025-06-01",
  scaleMode: "local",
};

const NATIONAL_FILTERS: MarketMapFilters = {
  ...LOCAL_FILTERS,
  scaleMode: "national",
};

// ---------------------------------------------------------------------------
// Pence → pounds conversion
// ---------------------------------------------------------------------------

describe("pence → pounds conversion", () => {
  it("converts 35 000 000 pence to 350 000 pounds", () => {
    const rows = [makeRow({ median_price_pence: 35_000_000 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    const props = fc.features[0]?.properties;
    expect(props?.median_price).toBe(350_000);
  });

  it("converts p10 and p90 correctly", () => {
    const rows = [makeRow({ p10_price_pence: 20_000_000, p90_price_pence: 60_000_000 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    const props = fc.features[0]?.properties;
    expect(props?.p10_price).toBe(200_000);
    expect(props?.p90_price).toBe(600_000);
  });

  it("rounds fractional pence to integer pounds (100 pence == £1)", () => {
    // 35_000_050 pence → 350000.5 → rounded to 350001 (Math.round)
    const rows = [makeRow({ median_price_pence: 35_000_050 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    const props = fc.features[0]?.properties;
    expect(Number.isInteger(props?.median_price)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// national vs local domain produces different buckets
// ---------------------------------------------------------------------------

describe("national vs local scale mode domain", () => {
  /**
   * Scenario: two areas, one cheap (£100k) and one expensive (£1.5M).
   * Under LOCAL scale both areas are at the extremes of the same set → buckets 1 and 9.
   * Under NATIONAL scale we pass a tight national domain (£200k–£500k).
   * £100k is below the national domain floor → bucket 1 still, but
   * £1.5M is above the national ceiling → bucket 9 still — so we use a
   * more interesting pair: two areas near each other nationally.
   *
   * Better construction: three areas locally (£200k, £300k, £400k).
   * Locally the domain is p5/p95 ≈ [£200k, £400k].
   * Nationally we pass a very wide domain (£100k → £1M).
   * Locally £200k maps near bucket 1 and £400k near bucket 9.
   * Nationally everything is compressed toward the middle.
   */
  it("same row gets different bucket under local vs national domain", () => {
    // Three rows, prices spread: £200k, £300k, £400k
    const rows = [
      makeRow({ area_id: "A", median_price_pence: 20_000_000, transaction_count: 50 }),
      makeRow({ area_id: "B", median_price_pence: 30_000_000, transaction_count: 50 }),
      makeRow({ area_id: "C", median_price_pence: 40_000_000, transaction_count: 50 }),
    ];

    // LOCAL: domain computed from this row set (£200k – £400k)
    const local = buildFeatureCollection(rows, LOCAL_FILTERS);

    // NATIONAL: wide national domain passed in (£50k → £2M) — middle area (£300k)
    // maps to a different bucket than under the tight local domain.
    const nationalDomain = { lo: 50_000, hi: 2_000_000 }; // pounds
    const national = buildFeatureCollection(rows, NATIONAL_FILTERS, nationalDomain);

    // Under local domain the cheapest area (£200k) gets bucket 1.
    // Under national domain it gets a higher bucket (further from bottom of 50k–2M range).
    const localBucketA = local.features.find((f) => f.properties?.area_id === "A")?.properties?.colour_bucket;
    const nationalBucketA = national.features.find((f) => f.properties?.area_id === "A")?.properties?.colour_bucket;

    expect(localBucketA).not.toBeNull();
    expect(nationalBucketA).not.toBeNull();
    expect(localBucketA).not.toBe(nationalBucketA);
  });
});

// ---------------------------------------------------------------------------
// Insufficient data (count < 5)
// ---------------------------------------------------------------------------

describe("rows with transaction_count < 5", () => {
  it("fill is INSUFFICIENT_COLOUR", () => {
    const rows = [makeRow({ transaction_count: 3 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    expect(fc.features[0]?.properties?.fill_colour).toBe(INSUFFICIENT_COLOUR);
  });

  it("colour_bucket is null", () => {
    const rows = [makeRow({ transaction_count: 4 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    expect(fc.features[0]?.properties?.colour_bucket).toBeNull();
  });

  it("confidence is Insufficient", () => {
    const rows = [makeRow({ transaction_count: 1 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    expect(fc.features[0]?.properties?.confidence).toBe("Insufficient");
  });
});

// ---------------------------------------------------------------------------
// Bucket extremes: cheap area → bucket 1 (green); expensive → bucket 9 (burgundy)
// ---------------------------------------------------------------------------

describe("bucket extremes", () => {
  it("a high-count cheap area in a range gets a low bucket (≤ 3 = green side)", () => {
    // Domain: £100k – £900k. Cheap area at £110k — just above floor.
    // log10 scale: just above floor → bucket 1.
    const rows = [
      makeRow({ area_id: "cheap",     median_price_pence: 11_000_000, transaction_count: 50 }),
      makeRow({ area_id: "mid",       median_price_pence: 50_000_000, transaction_count: 50 }),
      makeRow({ area_id: "expensive", median_price_pence: 90_000_000, transaction_count: 50 }),
    ];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    const cheapProps = fc.features.find((f) => f.properties?.area_id === "cheap")?.properties;
    expect(cheapProps?.colour_bucket).not.toBeNull();
    expect(cheapProps!.colour_bucket!).toBeLessThanOrEqual(3);
  });

  it("a high-count expensive area in the same range gets bucket 9 (burgundy)", () => {
    const rows = [
      makeRow({ area_id: "cheap",     median_price_pence: 11_000_000, transaction_count: 50 }),
      makeRow({ area_id: "mid",       median_price_pence: 50_000_000, transaction_count: 50 }),
      makeRow({ area_id: "expensive", median_price_pence: 90_000_000, transaction_count: 50 }),
    ];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    const expProps = fc.features.find((f) => f.properties?.area_id === "expensive")?.properties;
    expect(expProps?.colour_bucket).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

describe("metadata", () => {
  it("sqm_available is false", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    expect(fc.metadata.sqm_available).toBe(false);
  });

  it("metric is median_sold_price", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    expect(fc.metadata.metric).toBe("median_sold_price");
  });

  it("currency is GBP", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    expect(fc.metadata.currency).toBe("GBP");
  });

  it("minimum_transactions is 5", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    expect(fc.metadata.minimum_transactions).toBe(5);
  });

  it("scale_mode reflects the filter", () => {
    const localFc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    const nationalFc = buildFeatureCollection([makeRow({})], NATIONAL_FILTERS, { lo: 200_000, hi: 500_000 });
    expect(localFc.metadata.scale_mode).toBe("local");
    expect(nationalFc.metadata.scale_mode).toBe("national");
  });
});

// ---------------------------------------------------------------------------
// Null geometry handling
// ---------------------------------------------------------------------------

describe("null geojson", () => {
  it("feature is still included with geometry: null", () => {
    const rows = [makeRow({ geojson: null })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0]?.geometry).toBeNull();
  });

  it("feature with null geometry still has correct properties", () => {
    const rows = [makeRow({ geojson: null, median_price_pence: 25_000_000, transaction_count: 40 })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    const props = fc.features[0]?.properties;
    expect(props?.median_price).toBe(250_000);
    expect(props?.confidence).toBe("High");
  });
});

// ---------------------------------------------------------------------------
// property_type_mix null → {}
// ---------------------------------------------------------------------------

describe("property_type_mix", () => {
  it("null becomes an empty object", () => {
    const rows = [makeRow({ property_type_mix: null })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    expect(fc.features[0]?.properties?.property_type_mix).toEqual({});
  });

  it("non-null mix is passed through unchanged", () => {
    const mix = { detached: 20, terraced: 30 };
    const rows = [makeRow({ property_type_mix: mix })];
    const fc = buildFeatureCollection(rows, LOCAL_FILTERS);
    expect(fc.features[0]?.properties?.property_type_mix).toEqual(mix);
  });
});

// ---------------------------------------------------------------------------
// FeatureCollection shape
// ---------------------------------------------------------------------------

describe("FeatureCollection shape", () => {
  it("type is FeatureCollection", () => {
    const fc = buildFeatureCollection([], LOCAL_FILTERS);
    expect(fc.type).toBe("FeatureCollection");
  });

  it("empty rows produces empty features array", () => {
    const fc = buildFeatureCollection([], LOCAL_FILTERS);
    expect(fc.features).toEqual([]);
  });

  it("each feature has type Feature", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    expect(fc.features[0]?.type).toBe("Feature");
  });

  it("date_from and date_to are propagated from filters", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    const props = fc.features[0]?.properties;
    expect(props?.date_from).toBe("2022-01-01");
    expect(props?.date_to).toBe("2025-06-01");
  });

  it("scale_mode is propagated from filters", () => {
    const fc = buildFeatureCollection([makeRow({})], LOCAL_FILTERS);
    expect(fc.features[0]?.properties?.scale_mode).toBe("local");
  });
});
