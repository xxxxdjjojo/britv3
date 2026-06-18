/* eslint-disable no-console -- Server-side IO; console.error matches project pattern */
/**
 * Micro-area sold-price service (street / zoom ≥ 16 layer).
 *
 * Two exported entry points:
 *
 *   buildMicroAreaCollection  — PURE transformation (no IO; unit-tested)
 *   getMicroAreaFeatures      — async IO + orchestration (calls Supabase)
 *
 * Prices from Postgres are in PENCE. This layer divides by 100 and rounds to
 * integer POUNDS before placing values in feature properties.
 *
 * Label: "micro-area sold-price band" (NOT "street valuation", NOT "£/m²").
 * Only H3 hex CELLS are returned — individual transaction points are never
 * exposed to callers of this module.
 *
 * Colour domain: computed locally from the visible cells (micro-area scale is
 * inherently local — a national domain would wash out fine-grained variation).
 * Cells with transaction_count < 5 receive INSUFFICIENT_COLOUR (greyed).
 */

import type { Feature, FeatureCollection, Polygon } from "geojson";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceColour } from "@/lib/market-map/colour";
import { confidenceFor } from "@/lib/market-map/confidence";
import { computeClampBounds } from "@/lib/market-map/stats";
import { aggregateToH3 } from "@/lib/market-map/street";
import type { TxnPoint, MicroAreaCell } from "@/lib/market-map/street";
import type {
  MarketMapFilters,
  MarketMapFeatureProperties,
  MarketMapMetadata,
} from "./types";

// ---------------------------------------------------------------------------
// Extended metadata type (band_label added by Task 8)
// ---------------------------------------------------------------------------

/** Metadata block for the micro-area FeatureCollection. */
type MicroAreaMetadata = MarketMapMetadata & {
  /**
   * UI hint: display this label to clarify what the hex cells represent.
   * Value is always "micro-area sold-price band" for the street level.
   * NOT "street valuation" and NOT "£/m²".
   */
  band_label: "micro-area sold-price band";
};

// ---------------------------------------------------------------------------
// Extended FeatureCollection type
// ---------------------------------------------------------------------------

export type MicroAreaFeatureCollection = FeatureCollection<
  Polygon,
  MarketMapFeatureProperties
> & {
  metadata: MicroAreaMetadata;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PENCE_PER_POUND = 100;

function penceToPounds(pence: number): number {
  return Math.round(pence / PENCE_PER_POUND);
}

function buildMicroAreaMetadata(filters: MarketMapFilters): MicroAreaMetadata {
  return {
    metric: "median_sold_price",
    currency: "GBP",
    sqm_available: false,
    geography_level: "street",
    scale_mode: filters.scaleMode,
    source: "HM Land Registry Price Paid Data joined to postcode geography",
    minimum_transactions: 5,
    band_label: "micro-area sold-price band",
  };
}

function emptyMicroAreaCollection(
  filters: MarketMapFilters,
): MicroAreaFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [],
    metadata: buildMicroAreaMetadata(filters),
  };
}

// ---------------------------------------------------------------------------
// buildMicroAreaCollection — PURE (no IO, unit-tested)
// ---------------------------------------------------------------------------

/**
 * Converts MicroAreaCell aggregates (prices in pence) into a coloured GeoJSON
 * FeatureCollection of Polygon hex features.
 *
 * Colour domain is always LOCAL — computed from the count≥5 cell medians in
 * the current viewport. Micro-area scale is too fine for a national domain to
 * be meaningful; document this if a national mode is added later.
 *
 * @param cells          Aggregated H3 cells (prices in pence).
 * @param filters        Request filters (drives metadata + scale/date fields).
 * @param nationalDomain Optional pre-computed domain in POUNDS. When provided,
 *                       used instead of the local domain (supports future
 *                       national scale mode for this layer).
 */
export function buildMicroAreaCollection(
  cells: MicroAreaCell[],
  filters: MarketMapFilters,
  nationalDomain?: { lo: number; hi: number },
): MicroAreaFeatureCollection {
  // Compute local domain in POUNDS from count≥5 cells.
  const eligibleMedians = cells
    .filter((c) => c.transaction_count >= 5 && c.median_price_pence > 0)
    .map((c) => penceToPounds(c.median_price_pence));

  let domain: { lo: number; hi: number };
  if (nationalDomain !== undefined) {
    domain = nationalDomain;
  } else if (eligibleMedians.length >= 2) {
    domain = computeClampBounds(eligibleMedians);
  } else if (eligibleMedians.length === 1) {
    domain = { lo: eligibleMedians[0], hi: eligibleMedians[0] };
  } else {
    // No eligible cells — domain is irrelevant; all cells get INSUFFICIENT_COLOUR.
    domain = { lo: 0, hi: 1 };
  }

  const features: Feature<Polygon, MarketMapFeatureProperties>[] = cells.map(
    (cell) => {
      const medianPounds = penceToPounds(cell.median_price_pence);
      const p10Pounds = penceToPounds(cell.p10_price_pence);
      const p90Pounds = penceToPounds(cell.p90_price_pence);

      const { bucket, fill } = priceColour(
        medianPounds,
        cell.transaction_count,
        domain,
      );

      const confidence = confidenceFor(cell.transaction_count);

      // Build a GeoJSON Polygon from the boundary ring.
      // cellToBoundary(h3Index, true) already returns a closed [lng,lat] ring.
      // GeoJSON Polygon requires the ring to be closed (first === last vertex).
      const ring = cell.boundary;
      const firstVert = ring[0];
      const lastVert = ring[ring.length - 1];
      const closedRing: [number, number][] =
        firstVert[0] === lastVert[0] && firstVert[1] === lastVert[1]
          ? ring
          : [...ring, firstVert];

      const geometry: Polygon = {
        type: "Polygon",
        coordinates: [closedRing],
      };

      const properties: MarketMapFeatureProperties = {
        area_id: cell.h3Index,
        // Short readable label: last 7 chars of h3Index are reasonably unique at res 9.
        area_name: `Micro-area ${cell.h3Index.slice(-7)}`,
        geography_level: "street",
        median_price: medianPounds,
        p10_price: p10Pounds,
        p90_price: p90Pounds,
        transaction_count: cell.transaction_count,
        latest_transaction_date: cell.latest_transaction_date,
        confidence,
        colour_bucket: bucket,
        fill_colour: fill,
        scale_mode: filters.scaleMode,
        date_from: filters.fromDate,
        date_to: filters.toDate,
        // Property-type mix is not computed at cell level (H3 bucketing does not
        // carry type breakdown). The info panel can derive this from the street
        // stats panel (aggregateByStreet) if needed.
        property_type_mix: {},
      };

      return {
        type: "Feature",
        geometry,
        properties,
      };
    },
  );

  return {
    type: "FeatureCollection",
    features,
    metadata: buildMicroAreaMetadata(filters),
  };
}

// ---------------------------------------------------------------------------
// getMicroAreaFeatures — async IO + orchestration
// ---------------------------------------------------------------------------

/**
 * Fetches raw transaction points for the viewport bbox from Supabase, aggregates
 * them into H3 hex cells, and returns a coloured GeoJSON FeatureCollection.
 *
 * Requires `filters.bbox`. At zoom ≥ 16 the client always sends a bbox; if it
 * is missing we return an empty collection rather than fetching the whole country.
 *
 * Uses the admin client (service-role) to bypass RLS. Must only be called from
 * server-side code (API route handlers, RSC).
 *
 * Never throws — logs errors and returns an empty collection on failure.
 */
export async function getMicroAreaFeatures(
  filters: MarketMapFilters,
): Promise<MicroAreaFeatureCollection> {
  if (filters.bbox === undefined) {
    // Safety guard: never load country-wide points.
    console.error(
      "[micro-area-service] getMicroAreaFeatures called without bbox — returning empty collection",
    );
    return emptyMicroAreaCollection(filters);
  }

  const [minLng, minLat, maxLng, maxLat] = filters.bbox;

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("market_map_points", {
    p_min_lng: minLng,
    p_min_lat: minLat,
    p_max_lng: maxLng,
    p_max_lat: maxLat,
    p_property_type: filters.propertyType,
    p_from_date: filters.fromDate || null,
    p_to_date: filters.toDate || null,
  });

  if (error) {
    console.error(
      `[micro-area-service] Failed to fetch market_map_points: ${error.message}`,
    );
    return emptyMicroAreaCollection(filters);
  }

  const points = (data as TxnPoint[] | null) ?? [];
  const cells = aggregateToH3(points);

  return buildMicroAreaCollection(cells, filters);
}
