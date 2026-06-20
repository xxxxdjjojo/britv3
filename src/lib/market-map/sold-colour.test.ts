import { describe, it, expect } from "vitest";
import {
  SOLD_INSUFFICIENT_COLOUR,
  SOLD_RAMP,
  colourForSoldBucket,
  parseSoldParcelProperties,
  formatPounds,
  formatPricePerSqm,
} from "./sold-colour";

// ---------------------------------------------------------------------------
// SOLD_RAMP
// ---------------------------------------------------------------------------

describe("SOLD_RAMP", () => {
  it("has 9 stops", () => {
    expect(SOLD_RAMP).toHaveLength(9);
  });

  it("uses an insufficient colour distinct from every ramp stop", () => {
    expect(SOLD_RAMP).not.toContain(SOLD_INSUFFICIENT_COLOUR);
  });

  it("is a distinct warm ramp, not the choropleth green/gold/burgundy", () => {
    // Sanity: first stop is pale amber, last is deep maroon.
    expect(SOLD_RAMP[0]).toBe("#FFF3D6");
    expect(SOLD_RAMP[8]).toBe("#6E0F0A");
  });
});

// ---------------------------------------------------------------------------
// colourForSoldBucket
// ---------------------------------------------------------------------------

describe("colourForSoldBucket", () => {
  it("returns the ramp hex for buckets 1..9", () => {
    for (let bucket = 1; bucket <= 9; bucket++) {
      expect(colourForSoldBucket(bucket)).toBe(SOLD_RAMP[bucket - 1]);
    }
  });

  it("returns the insufficient grey for null", () => {
    expect(colourForSoldBucket(null)).toBe(SOLD_INSUFFICIENT_COLOUR);
  });

  it("returns the insufficient grey for out-of-range buckets", () => {
    expect(colourForSoldBucket(0)).toBe(SOLD_INSUFFICIENT_COLOUR);
    expect(colourForSoldBucket(10)).toBe(SOLD_INSUFFICIENT_COLOUR);
  });
});

// ---------------------------------------------------------------------------
// parseSoldParcelProperties
// ---------------------------------------------------------------------------

describe("parseSoldParcelProperties", () => {
  it("parses a realistic single-sale parcel with camelCase mapping", () => {
    const props = {
      inspire_id: "INSPIRE-123",
      bucket: 6,
      sale_count: 1,
      median_price_pence: 45_000_000,
      median_price_per_sqm_pence: 625_000,
      dominant_property_type: "semi-detached",
      latest_transfer_date: "2024-03-12",
      sales: JSON.stringify([
        {
          address: "12 Acacia Avenue",
          date: "2024-03-12",
          price: 45_000_000,
          ppsqm: 625_000,
          type: "semi-detached",
          floor_area: 72,
          estimated_location: true,
        },
      ]),
    };

    const parcel = parseSoldParcelProperties(props);
    expect(parcel).not.toBeNull();
    expect(parcel!.inspireId).toBe("INSPIRE-123");
    expect(parcel!.bucket).toBe(6);
    expect(parcel!.saleCount).toBe(1);
    expect(parcel!.medianPricePence).toBe(45_000_000);
    expect(parcel!.medianPricePerSqmPence).toBe(625_000);
    expect(parcel!.dominantPropertyType).toBe("semi-detached");
    expect(parcel!.latestTransferDate).toBe("2024-03-12");

    expect(parcel!.sales).toHaveLength(1);
    const sale = parcel!.sales[0];
    expect(sale.address).toBe("12 Acacia Avenue");
    expect(sale.date).toBe("2024-03-12");
    expect(sale.price).toBe(45_000_000);
    expect(sale.ppsqm).toBe(625_000);
    expect(sale.type).toBe("semi-detached");
    expect(sale.floorArea).toBe(72);
    expect(sale.estimatedLocation).toBe(true);
  });

  it("parses a multi-sale (flat block) parcel with three entries", () => {
    const props = {
      inspire_id: "INSPIRE-FLATS",
      bucket: 4,
      sale_count: 3,
      median_price_pence: 30_000_000,
      median_price_per_sqm_pence: 500_000,
      dominant_property_type: "flat",
      latest_transfer_date: "2025-01-09",
      sales: JSON.stringify([
        { address: "Flat 1", date: "2023-06-01", price: 28_000_000, ppsqm: 480_000, type: "flat", floor_area: 58, estimated_location: false },
        { address: "Flat 2", date: "2024-02-14", price: 30_000_000, ppsqm: 500_000, type: "flat", floor_area: 60, estimated_location: false },
        { address: "Flat 3", date: "2025-01-09", price: 32_000_000, ppsqm: 520_000, type: "flat", floor_area: 61, estimated_location: false },
      ]),
    };

    const parcel = parseSoldParcelProperties(props);
    expect(parcel).not.toBeNull();
    expect(parcel!.saleCount).toBe(3);
    expect(parcel!.sales).toHaveLength(3);
    expect(parcel!.sales.map((s) => s.address)).toEqual([
      "Flat 1",
      "Flat 2",
      "Flat 3",
    ]);
    expect(parcel!.sales[2].floorArea).toBe(61);
  });

  it("maps null bucket / null £/m² / null address defensively", () => {
    const props = {
      inspire_id: "INSPIRE-NOAREA",
      bucket: null,
      sale_count: 1,
      median_price_pence: 20_000_000,
      median_price_per_sqm_pence: null,
      dominant_property_type: "terraced",
      latest_transfer_date: "2022-11-30",
      sales: JSON.stringify([
        { address: null, date: "2022-11-30", price: 20_000_000, ppsqm: null, type: "terraced", floor_area: null, estimated_location: false },
      ]),
    };

    const parcel = parseSoldParcelProperties(props);
    expect(parcel!.bucket).toBeNull();
    expect(parcel!.medianPricePerSqmPence).toBeNull();
    expect(parcel!.sales[0].address).toBeNull();
    expect(parcel!.sales[0].ppsqm).toBeNull();
    expect(parcel!.sales[0].floorArea).toBeNull();
  });

  it("returns null when inspire_id is missing", () => {
    const props = {
      bucket: 5,
      sale_count: 1,
      median_price_pence: 40_000_000,
      median_price_per_sqm_pence: 600_000,
      dominant_property_type: "flat",
      latest_transfer_date: "2024-01-01",
      sales: "[]",
    };
    expect(parseSoldParcelProperties(props)).toBeNull();
  });

  it("returns null when sales JSON is malformed", () => {
    const props = {
      inspire_id: "INSPIRE-BAD",
      bucket: 5,
      sale_count: 1,
      median_price_pence: 40_000_000,
      median_price_per_sqm_pence: 600_000,
      dominant_property_type: "flat",
      latest_transfer_date: "2024-01-01",
      sales: "{not valid json",
    };
    expect(parseSoldParcelProperties(props)).toBeNull();
  });

  it("defaults to an empty sales array when sales prop is absent", () => {
    const props = {
      inspire_id: "INSPIRE-EMPTY",
      bucket: 5,
      sale_count: 0,
      median_price_pence: 0,
      median_price_per_sqm_pence: null,
      dominant_property_type: "other",
      latest_transfer_date: "2024-01-01",
    };
    const parcel = parseSoldParcelProperties(props);
    expect(parcel!.sales).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// formatPounds / formatPricePerSqm
// ---------------------------------------------------------------------------

describe("formatPounds", () => {
  it("formats pence as grouped £ with no decimals", () => {
    expect(formatPounds(45_000_000)).toBe("£450,000");
  });
});

describe("formatPricePerSqm", () => {
  it("formats pence-per-m² with the /m² suffix", () => {
    expect(formatPricePerSqm(625_000)).toBe("£6,250/m²");
  });

  it("returns null when given null", () => {
    expect(formatPricePerSqm(null)).toBeNull();
  });
});
