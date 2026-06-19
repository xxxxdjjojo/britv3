/**
 * Tests for street.ts — pure H3 aggregation utilities.
 *
 * Strategy:
 * - Use real lat/lng coords so we KNOW which H3 cell they fall in.
 * - Two clusters at different coords → two distinct cells.
 * - Same lat/lng → same cell (by definition of H3).
 * - Assert counts, medians, boundary shape, centroid placement.
 * - aggregateByStreet: grouping, null-street skipping, median correctness.
 */

import { describe, it, expect } from "vitest";
import { latLngToCell, cellToLatLng } from "h3-js";
import { aggregateToH3, aggregateByStreet } from "./street";
import type { TxnPoint } from "./street";
import { median } from "./stats";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Two well-separated London coords that land in different H3 res-9 cells. */
const LON_A = { latitude: 51.5074, longitude: -0.1278 }; // near Charing Cross
const LON_B = { latitude: 51.515, longitude: -0.09 }; // Barbican area

// Confirm they're in different cells at res 9 (test assumption guard).
const CELL_A = latLngToCell(LON_A.latitude, LON_A.longitude, 9);
const CELL_B = latLngToCell(LON_B.latitude, LON_B.longitude, 9);

function makePt(
  opts: { latitude: number; longitude: number; price_pence: number; date?: string; street?: string | null; town?: string | null },
): TxnPoint {
  return {
    latitude: opts.latitude,
    longitude: opts.longitude,
    price_pence: opts.price_pence,
    transfer_date: opts.date ?? "2024-01-01",
    // Use "in" check so explicit null/empty-string pass through unchanged.
    street: "street" in opts ? (opts.street ?? null) : "TEST STREET",
    town: "town" in opts ? (opts.town ?? null) : "London",
  };
}

// ---------------------------------------------------------------------------
// aggregateToH3
// ---------------------------------------------------------------------------

describe("aggregateToH3", () => {
  it("returns an empty array for empty input", () => {
    expect(aggregateToH3([])).toEqual([]);
  });

  it("groups points at the same location into one cell", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 300_000_00 }),
      makePt({ ...LON_A, price_pence: 400_000_00 }),
      makePt({ ...LON_A, price_pence: 500_000_00 }),
    ];
    const cells = aggregateToH3(pts, 9);
    expect(cells).toHaveLength(1);
    expect(cells[0].h3Index).toBe(CELL_A);
  });

  it("produces two separate cells for two separated clusters", () => {
    // Guarantee the test assumption holds.
    expect(CELL_A).not.toBe(CELL_B);

    const pts = [
      makePt({ ...LON_A, price_pence: 300_000_00 }),
      makePt({ ...LON_B, price_pence: 400_000_00 }),
    ];
    const cells = aggregateToH3(pts, 9);
    expect(cells).toHaveLength(2);
    const indices = cells.map((c) => c.h3Index);
    expect(indices).toContain(CELL_A);
    expect(indices).toContain(CELL_B);
  });

  it("counts all points in a cell", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 100_00 }),
      makePt({ ...LON_A, price_pence: 200_00 }),
      makePt({ ...LON_A, price_pence: 300_00 }),
      makePt({ ...LON_A, price_pence: 400_00 }),
      makePt({ ...LON_A, price_pence: 500_00 }),
    ];
    const cells = aggregateToH3(pts, 9);
    expect(cells[0].transaction_count).toBe(5);
  });

  it("total transaction_count across cells equals input length", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00 }),
      makePt({ ...LON_A, price_pence: 250_000_00 }),
      makePt({ ...LON_B, price_pence: 350_000_00 }),
      makePt({ ...LON_B, price_pence: 400_000_00 }),
      makePt({ ...LON_B, price_pence: 450_000_00 }),
    ];
    const cells = aggregateToH3(pts, 9);
    const total = cells.reduce((s, c) => s + c.transaction_count, 0);
    expect(total).toBe(pts.length);
  });

  it("median matches the stats util for the cell's prices", () => {
    const prices = [200_000_00, 300_000_00, 500_000_00];
    const pts = prices.map((p) => makePt({ ...LON_A, price_pence: p }));
    const cells = aggregateToH3(pts, 9);
    expect(cells[0].median_price_pence).toBe(Math.round(median(prices)));
  });

  it("p10 and p90 are computed for the cell", () => {
    const prices = [100_00, 200_00, 300_00, 400_00, 500_00, 600_00, 700_00, 800_00, 900_00, 1000_00];
    const pts = prices.map((p) => makePt({ ...LON_A, price_pence: p }));
    const cells = aggregateToH3(pts, 9);
    const cell = cells[0];
    // p10 of 10 values (sorted): index 0.9 → 100 + 0.9*(200-100) = 190
    expect(cell.p10_price_pence).toBe(190_00);
    // p90: index 8.1 → 900 + 0.1*(1000-900) = 910
    expect(cell.p90_price_pence).toBe(910_00);
  });

  it("latest_transaction_date is the most recent date in the cell", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 300_000_00, date: "2023-06-01" }),
      makePt({ ...LON_A, price_pence: 400_000_00, date: "2024-11-15" }),
      makePt({ ...LON_A, price_pence: 350_000_00, date: "2022-01-20" }),
    ];
    const cells = aggregateToH3(pts, 9);
    expect(cells[0].latest_transaction_date).toBe("2024-11-15");
  });

  it("boundary has 6 or 7 vertices (hex or closed-hex in GeoJSON mode)", () => {
    const pts = [makePt({ ...LON_A, price_pence: 300_000_00 })];
    const cells = aggregateToH3(pts, 9);
    const { boundary } = cells[0];
    // cellToBoundary with formatAsGeoJson=true returns a closed ring (7 verts)
    // for a regular hexagon, or up to 10 for edge-spanning cases.
    expect(boundary.length).toBeGreaterThanOrEqual(6);
    expect(boundary.length).toBeLessThanOrEqual(10);
  });

  it("each boundary vertex is a [lng, lat] pair with plausible UK coords", () => {
    const pts = [makePt({ ...LON_A, price_pence: 300_000_00 })];
    const cells = aggregateToH3(pts, 9);
    for (const [lng, lat] of cells[0].boundary) {
      // UK bounding box roughly: lat 49-61, lng -8 to 2
      expect(lat).toBeGreaterThan(49);
      expect(lat).toBeLessThan(62);
      expect(lng).toBeGreaterThan(-9);
      expect(lng).toBeLessThan(3);
    }
  });

  it("centroid is [lng, lat] and matches cellToLatLng (reversed)", () => {
    const pts = [makePt({ ...LON_A, price_pence: 300_000_00 })];
    const cells = aggregateToH3(pts, 9);
    const [cLat, cLng] = cellToLatLng(cells[0].h3Index);
    expect(cells[0].centroid[0]).toBeCloseTo(cLng, 6);
    expect(cells[0].centroid[1]).toBeCloseTo(cLat, 6);
  });

  it("centroid is within the UK bounding box for a UK point", () => {
    const pts = [makePt({ ...LON_A, price_pence: 300_000_00 })];
    const cells = aggregateToH3(pts, 9);
    const [lng, lat] = cells[0].centroid;
    expect(lat).toBeGreaterThan(49);
    expect(lat).toBeLessThan(62);
    expect(lng).toBeGreaterThan(-9);
    expect(lng).toBeLessThan(3);
  });

  it("works with resolution 7 (coarser cells — fewer cells for same points)", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00 }),
      makePt({ ...LON_B, price_pence: 350_000_00 }),
    ];
    const cellsRes7 = aggregateToH3(pts, 7);
    const cellsRes9 = aggregateToH3(pts, 9);
    // Res-7 cells are much larger; LON_A and LON_B may land in the same cell.
    // Either way, total count must equal input.
    const total = cellsRes7.reduce((s, c) => s + c.transaction_count, 0);
    expect(total).toBe(pts.length);
    // Res-9 should generally produce >= cells than res-7 for spread points.
    expect(cellsRes9.length).toBeGreaterThanOrEqual(cellsRes7.length);
  });
});

// ---------------------------------------------------------------------------
// aggregateByStreet
// ---------------------------------------------------------------------------

describe("aggregateByStreet", () => {
  it("returns empty array for empty input", () => {
    expect(aggregateByStreet([])).toEqual([]);
  });

  it("skips points with null street", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 300_000_00, street: null }),
      makePt({ ...LON_A, price_pence: 400_000_00, street: "HIGH STREET" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results).toHaveLength(1);
    expect(results[0].street).toBe("HIGH STREET");
  });

  it("skips points with empty-string or whitespace-only street", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 300_000_00, street: "" }),
      makePt({ ...LON_A, price_pence: 300_000_00, street: "   " }),
      makePt({ ...LON_A, price_pence: 400_000_00, street: "BAKER STREET" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results).toHaveLength(1);
  });

  it("groups same street + town (case-insensitive) into one entry", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00, street: "HIGH STREET", town: "London" }),
      makePt({ ...LON_A, price_pence: 300_000_00, street: "High Street", town: "LONDON" }),
      makePt({ ...LON_A, price_pence: 400_000_00, street: "high street", town: "london" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results).toHaveLength(1);
    expect(results[0].transaction_count).toBe(3);
  });

  it("separates different streets into different entries", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00, street: "HIGH STREET", town: "London" }),
      makePt({ ...LON_A, price_pence: 300_000_00, street: "LOW STREET", town: "London" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results).toHaveLength(2);
  });

  it("separates same street in different towns", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00, street: "HIGH STREET", town: "London" }),
      makePt({ ...LON_B, price_pence: 300_000_00, street: "HIGH STREET", town: "Manchester" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results).toHaveLength(2);
  });

  it("computes correct median for the street group", () => {
    const prices = [200_000_00, 300_000_00, 400_000_00];
    const pts = prices.map((p) =>
      makePt({ ...LON_A, price_pence: p, street: "OAK AVENUE", town: "Leeds" }),
    );
    const results = aggregateByStreet(pts);
    expect(results[0].median_price_pence).toBe(Math.round(median(prices)));
  });

  it("picks the latest transfer_date in the group", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00, street: "ELM ROAD", date: "2022-03-01" }),
      makePt({ ...LON_A, price_pence: 300_000_00, street: "ELM ROAD", date: "2024-07-15" }),
      makePt({ ...LON_A, price_pence: 350_000_00, street: "ELM ROAD", date: "2023-11-30" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results[0].latest_transaction_date).toBe("2024-07-15");
  });

  it("street_key is lower(street)|lower(town)", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 200_000_00, street: "MAIN ROAD", town: "Leeds" }),
    ];
    const results = aggregateByStreet(pts);
    expect(results[0].street_key).toBe("main road|leeds");
  });

  it("total transaction_count equals non-null-street input count", () => {
    const pts = [
      makePt({ ...LON_A, price_pence: 100_00, street: null }),
      makePt({ ...LON_A, price_pence: 200_00, street: "ALPHA ST" }),
      makePt({ ...LON_A, price_pence: 300_00, street: "BETA ST" }),
      makePt({ ...LON_A, price_pence: 400_00, street: "ALPHA ST" }),
    ];
    const results = aggregateByStreet(pts);
    const total = results.reduce((s, r) => s + r.transaction_count, 0);
    expect(total).toBe(3); // null street skipped
  });
});
