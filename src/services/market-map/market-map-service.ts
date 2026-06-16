/* eslint-disable no-console -- Server-side IO function; console.error matches project pattern (see portfolio-service.ts) */
/**
 * Market-map service layer.
 *
 * Two exported entry points:
 *
 *   buildFeatureCollection  — pure transformation (no IO; unit-tested)
 *   getMarketMapFeatures    — async IO + orchestration (calls Supabase)
 *
 * Prices from Postgres are in PENCE. This layer divides by 100 and rounds to
 * integer pounds before placing values in feature properties or computing
 * the colour domain.
 *
 * Null geometry: features with no matching boundary row (geojson === null)
 * are included in the FeatureCollection with geometry: null so the info panel
 * can still list them; the map layer silently skips null-geometry features.
 */

import type { Feature, FeatureCollection, Geometry } from "geojson";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceColour } from "@/lib/market-map/colour";
import { confidenceFor } from "@/lib/market-map/confidence";
import { computeClampBounds } from "@/lib/market-map/stats";
import type {
  MarketMapFilters,
  MarketMapFeatureProperties,
  MarketMapMetadata,
} from "./types";

// ---------------------------------------------------------------------------
// Raw RPC row shape (returned by market_map_features / market_map_aggregate)
// ---------------------------------------------------------------------------

/** Raw row from the market_map_features RPC (prices in pence). */
type RawFeatureRow = {
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
};

/** Raw row from the market_map_aggregate RPC (prices in pence, no geojson). */
type RawAggregateRow = Omit<RawFeatureRow, "geojson">;

// ---------------------------------------------------------------------------
// Extended FeatureCollection type carrying our metadata block
// ---------------------------------------------------------------------------

type MarketMapFeatureCollection = FeatureCollection<
  Geometry | null,
  MarketMapFeatureProperties
> & {
  metadata: MarketMapMetadata;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PENCE_PER_POUND = 100;

function penceToPounds(pence: number): number {
  return Math.round(pence / PENCE_PER_POUND);
}

function emptyCollection(
  filters: MarketMapFilters,
): MarketMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [],
    metadata: buildMetadata(filters),
  };
}

function buildMetadata(filters: MarketMapFilters): MarketMapMetadata {
  return {
    metric: "median_sold_price",
    currency: "GBP",
    sqm_available: false,
    scale_mode: filters.scaleMode,
    source: "HM Land Registry Price Paid Data joined to postcode geography",
    minimum_transactions: 5,
  };
}

// ---------------------------------------------------------------------------
// buildFeatureCollection — PURE (no IO, fully unit-tested)
// ---------------------------------------------------------------------------

/**
 * Converts raw RPC rows (prices in pence) into a coloured GeoJSON
 * FeatureCollection ready for the map renderer.
 *
 * @param rows           Raw rows from market_map_features RPC.
 * @param filters        Request filters (drives metadata + scale mode).
 * @param nationalDomain Pre-computed p5/p95 domain in POUNDS for national
 *                       scale mode. Required when filters.scaleMode === "national";
 *                       ignored when scaleMode === "local".
 */
export function buildFeatureCollection(
  rows: RawFeatureRow[],
  filters: MarketMapFilters,
  nationalDomain?: { lo: number; hi: number },
): MarketMapFeatureCollection {
  // Convert all medians to pounds for domain computation.
  const mediansInPounds = rows
    .filter((r) => r.transaction_count >= 5 && r.median_price_pence > 0)
    .map((r) => penceToPounds(r.median_price_pence));

  // Resolve the colour domain (always in POUNDS, consistent with priceColour input).
  let domain: { lo: number; hi: number };
  if (filters.scaleMode === "national" && nationalDomain !== undefined) {
    domain = nationalDomain;
  } else if (mediansInPounds.length >= 2) {
    domain = computeClampBounds(mediansInPounds);
  } else if (mediansInPounds.length === 1) {
    // Single eligible area: degenerate domain — priceColour will return bucket 5.
    domain = { lo: mediansInPounds[0], hi: mediansInPounds[0] };
  } else {
    // No eligible areas (all insufficient or empty): domain is irrelevant;
    // priceColour will return INSUFFICIENT_COLOUR for every row.
    domain = { lo: 0, hi: 1 };
  }

  const features: Feature<Geometry | null, MarketMapFeatureProperties>[] =
    rows.map((row) => {
      const medianPounds = penceToPounds(row.median_price_pence);
      const p10Pounds = penceToPounds(row.p10_price_pence);
      const p90Pounds = penceToPounds(row.p90_price_pence);

      const { bucket, fill } = priceColour(
        medianPounds,
        row.transaction_count,
        domain,
      );

      const confidence = confidenceFor(row.transaction_count);

      // Parse the GeoJSON string. Null or malformed → geometry: null.
      let geometry: Geometry | null = null;
      if (row.geojson !== null) {
        try {
          geometry = JSON.parse(row.geojson) as Geometry;
        } catch {
          // Malformed geometry string: treat as absent.
          geometry = null;
        }
      }

      const properties: MarketMapFeatureProperties = {
        area_id: row.area_id,
        area_name: row.area_name ?? null,
        geography_level: row.geography_level,
        median_price: medianPounds,
        p10_price: p10Pounds,
        p90_price: p90Pounds,
        transaction_count: row.transaction_count,
        latest_transaction_date: row.latest_transaction_date ?? null,
        confidence,
        colour_bucket: bucket,
        fill_colour: fill,
        scale_mode: filters.scaleMode,
        date_from: filters.fromDate,
        date_to: filters.toDate,
        property_type_mix: row.property_type_mix ?? {},
      };

      return {
        type: "Feature",
        geometry,
        properties,
      };
    });

  return {
    type: "FeatureCollection",
    features,
    metadata: buildMetadata(filters),
  };
}

// ---------------------------------------------------------------------------
// getMarketMapFeatures — async IO + orchestration
// ---------------------------------------------------------------------------

/**
 * Fetches market-map data from Supabase and returns a coloured GeoJSON
 * FeatureCollection.
 *
 * Uses the admin client (service-role) to bypass RLS — this function must
 * only be called from server-side code (API route handlers, RSC).
 *
 * On any Supabase error, logs and returns an empty FeatureCollection so the
 * map renders grey rather than producing a 500.
 *
 * @param filters  All filters for the request.
 * @returns        A MarketMapFeatureCollection (FeatureCollection + metadata).
 */
export async function getMarketMapFeatures(
  filters: MarketMapFilters,
): Promise<MarketMapFeatureCollection> {
  const supabase = createAdminClient();

  const {
    geographyLevel: level,
    propertyType,
    fromDate,
    toDate,
    scaleMode,
    bbox,
  } = filters;

  // ------------------------------------------------------------------
  // National scale: fetch the full national aggregate first to compute
  // the p5/p95 domain over all areas (no bbox filter).
  // ------------------------------------------------------------------
  let nationalDomain: { lo: number; hi: number } | undefined;

  if (scaleMode === "national") {
    const { data: nationalRows, error: nationalError } = await supabase.rpc(
      "market_map_aggregate",
      {
        p_level: level,
        p_property_type: propertyType,
        p_from_date: fromDate || null,
        p_to_date: toDate || null,
      },
    );

    if (nationalError) {
      console.error(
        `[market-map-service] Failed to fetch national aggregate: ${nationalError.message}`,
      );
      return emptyCollection(filters);
    }

    const nationalMedians = ((nationalRows as RawAggregateRow[]) ?? [])
      .filter((r) => r.transaction_count >= 5 && r.median_price_pence > 0)
      .map((r) => penceToPounds(r.median_price_pence));

    if (nationalMedians.length >= 2) {
      nationalDomain = computeClampBounds(nationalMedians);
    } else if (nationalMedians.length === 1) {
      nationalDomain = { lo: nationalMedians[0], hi: nationalMedians[0] };
    }
    // If no eligible national rows, nationalDomain stays undefined and
    // buildFeatureCollection falls back to local domain computation.
  }

  // ------------------------------------------------------------------
  // Fetch features (stats + geometry), optionally bbox-filtered.
  // ------------------------------------------------------------------
  const bboxParams =
    bbox !== undefined
      ? {
          p_min_lng: bbox[0],
          p_min_lat: bbox[1],
          p_max_lng: bbox[2],
          p_max_lat: bbox[3],
        }
      : {
          p_min_lng: null,
          p_min_lat: null,
          p_max_lng: null,
          p_max_lat: null,
        };

  const { data: featureRows, error: featureError } = await supabase.rpc(
    "market_map_features",
    {
      p_level: level,
      p_property_type: propertyType,
      p_from_date: fromDate || null,
      p_to_date: toDate || null,
      ...bboxParams,
    },
  );

  if (featureError) {
    console.error(
      `[market-map-service] Failed to fetch market_map_features: ${featureError.message}`,
    );
    return emptyCollection(filters);
  }

  const rows = (featureRows as RawFeatureRow[]) ?? [];
  return buildFeatureCollection(rows, filters, nationalDomain);
}
