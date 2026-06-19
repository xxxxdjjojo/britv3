/**
 * Converts a geocoder search result into MapLibre fitBounds params plus the
 * geography level to load at the target zoom.
 *
 * This is the implementation of acceptance criterion #15:
 * "search result to fitBounds behaviour".
 *
 * No IO, no MapLibre import, no React. Pure data transformation.
 */

import { geographyLevelForZoom } from "./geography";
import type { GeographyLevel } from "./geography";

/**
 * A geocoder search result (e.g. from MapTiler geocoding or a local area index).
 *
 * - `id`           — stable identifier for the area.
 * - `name`         — human-readable label.
 * - `type`         — area type hint (informational; geography level is derived
 *                    from `default_zoom`).
 * - `bbox`         — bounding box as `[west, south, east, north]`.
 * - `center`       — representative point as `[lng, lat]`.
 * - `default_zoom` — the zoom level the map should target when flying to this result.
 */
export type MarketSearchResult = {
  id: string;
  name: string;
  type: string;
  bbox: [number, number, number, number];
  center: [number, number];
  default_zoom: number;
};

/**
 * Parameters to pass directly to MapLibre's `map.fitBounds()` / `flyTo()`.
 *
 * - `bounds`         — south-west and north-east corners: `[[w,s],[e,n]]`.
 * - `center`         — map centre to use alongside the bounds.
 * - `zoom`           — target zoom level.
 * - `geographyLevel` — the canonical geography layer to load at this zoom.
 */
export type FitBoundsParams = {
  bounds: [[number, number], [number, number]];
  center: [number, number];
  zoom: number;
  geographyLevel: GeographyLevel;
};

/**
 * Derives MapLibre fitBounds parameters from a geocoder search result.
 *
 * bbox `[west, south, east, north]` is reshaped to `[[west, south], [east, north]]`.
 * The geography level is derived from `result.default_zoom` via `geographyLevelForZoom`.
 */
export function fitBoundsFor(result: MarketSearchResult): FitBoundsParams {
  const [west, south, east, north] = result.bbox;

  return {
    bounds: [
      [west, south],
      [east, north],
    ],
    center: result.center,
    zoom: result.default_zoom,
    geographyLevel: geographyLevelForZoom(result.default_zoom),
  };
}
