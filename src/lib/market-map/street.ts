/**
 * Pure aggregation utilities for the street / micro-area sold-price layer.
 *
 * At zoom ≥ 16 we have no street boundary polygons, so we aggregate
 * transaction points into H3 hexagon cells (resolution 9 by default,
 * ~0.1 km² per cell). Only CELLS are returned — individual transaction
 * points are never exposed to callers.
 *
 * Label: "micro-area sold-price band" (NOT "street valuation", NOT "£/m²").
 * Colour logic: cells with transaction_count < 5 are greyed — same threshold
 * as all other geography levels.
 *
 * No IO, no side effects. Safe to import in any context.
 */

import { latLngToCell, cellToBoundary, cellToLatLng } from "h3-js";
import { median, percentile } from "./stats";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single sold-price transaction point from the DB. */
export type TxnPoint = {
  latitude: number;
  longitude: number;
  price_pence: number;
  transfer_date: string;
  street: string | null;
  town: string | null;
};

/**
 * An H3 hex cell aggregating multiple transaction points.
 * `boundary` is a [lng, lat] ring (GeoJSON convention, may be closed).
 * `centroid` is [lng, lat].
 * Prices are in PENCE — callers (the service layer) convert to pounds.
 */
export type MicroAreaCell = {
  h3Index: string;
  median_price_pence: number;
  p10_price_pence: number;
  p90_price_pence: number;
  transaction_count: number;
  /** ISO date string of the most-recent transaction in this cell. */
  latest_transaction_date: string;
  /** [lng, lat] ring (GeoJSON order). May include closing vertex. */
  boundary: [number, number][];
  /** [lng, lat] centroid of the cell. */
  centroid: [number, number];
};

/** Street-level stats for the info panel / tooltips. */
export type StreetStats = {
  street_key: string;
  street: string | null;
  town: string | null;
  median_price_pence: number;
  p10_price_pence: number;
  p90_price_pence: number;
  transaction_count: number;
  latest_transaction_date: string;
};

// ---------------------------------------------------------------------------
// aggregateToH3
// ---------------------------------------------------------------------------

/**
 * Buckets transaction points into H3 cells at the given resolution and
 * computes per-cell price statistics.
 *
 * @param points     Raw transaction points from the DB.
 * @param resolution H3 resolution (default 9, ~0.1 km² per hex).
 * @returns          One cell per occupied H3 index. ALL cells are returned;
 *                   count-threshold filtering (≥5) is applied in the colour
 *                   layer (`priceColour` / `buildMicroAreaCollection`).
 */
export function aggregateToH3(
  points: readonly TxnPoint[],
  resolution = 9,
): MicroAreaCell[] {
  // Group points by H3 index.
  const buckets = new Map<string, TxnPoint[]>();

  for (const pt of points) {
    const h3Index = latLngToCell(pt.latitude, pt.longitude, resolution);
    const existing = buckets.get(h3Index);
    if (existing !== undefined) {
      existing.push(pt);
    } else {
      buckets.set(h3Index, [pt]);
    }
  }

  // Build one MicroAreaCell per bucket.
  const cells: MicroAreaCell[] = [];

  for (const [h3Index, pts] of buckets) {
    const prices = pts.map((p) => p.price_pence);

    // Latest date — compare ISO strings (YYYY-MM-DD lexicographic sort is safe).
    const latestDate = pts.reduce<string>(
      (best, p) => (p.transfer_date > best ? p.transfer_date : best),
      pts[0].transfer_date,
    );

    // cellToBoundary(h3Index, true) → GeoJSON order [lng, lat], closed loop.
    const rawBoundary = cellToBoundary(h3Index, true) as [number, number][];

    // cellToLatLng → [lat, lng]; we need [lng, lat] for GeoJSON.
    const [cLat, cLng] = cellToLatLng(h3Index);

    cells.push({
      h3Index,
      median_price_pence: Math.round(median(prices)),
      p10_price_pence: Math.round(percentile(prices, 10)),
      p90_price_pence: Math.round(percentile(prices, 90)),
      transaction_count: pts.length,
      latest_transaction_date: latestDate,
      boundary: rawBoundary,
      centroid: [cLng, cLat],
    });
  }

  return cells;
}

// ---------------------------------------------------------------------------
// aggregateByStreet
// ---------------------------------------------------------------------------

/**
 * Groups transaction points by normalised street key for the ranked list /
 * tooltip panel. Points with null or empty `street` are skipped.
 *
 * Street key: `lower(trim(street)) + "|" + lower(trim(town ?? ""))`.
 *
 * Prices remain in PENCE.
 */
export function aggregateByStreet(points: readonly TxnPoint[]): StreetStats[] {
  const buckets = new Map<string, { pts: TxnPoint[]; street: string; town: string | null }>();

  for (const pt of points) {
    if (pt.street === null) continue; // skip null street
    const streetTrimmed = pt.street.trim();
    if (streetTrimmed === "") continue; // skip blank street

    const townNorm = (pt.town?.trim() ?? "").toLowerCase();
    const key = `${streetTrimmed.toLowerCase()}|${townNorm}`;

    const existing = buckets.get(key);
    if (existing !== undefined) {
      existing.pts.push(pt);
    } else {
      buckets.set(key, { pts: [pt], street: pt.street, town: pt.town });
    }
  }

  const results: StreetStats[] = [];

  for (const [key, { pts, street, town }] of buckets) {
    const prices = pts.map((p) => p.price_pence);

    const latestDate = pts.reduce<string>(
      (best, p) => (p.transfer_date > best ? p.transfer_date : best),
      pts[0].transfer_date,
    );

    results.push({
      street_key: key,
      street,
      town,
      median_price_pence: Math.round(median(prices)),
      p10_price_pence: Math.round(percentile(prices, 10)),
      p90_price_pence: Math.round(percentile(prices, 90)),
      transaction_count: pts.length,
      latest_transaction_date: latestDate,
    });
  }

  return results;
}
