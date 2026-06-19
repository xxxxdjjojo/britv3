"use client";

/**
 * TanStack Query hook for fetching viewport-scoped choropleth GeoJSON
 * from GET /api/market-map.
 *
 * Debounces bbox/zoom changes by 300 ms (same cadence as useSearch) to avoid
 * spamming the API during a pan or pinch-zoom gesture.
 */

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import type { FeatureCollection, Geometry } from "geojson";
import { geographyLevelForZoom } from "@/lib/market-map/geography";
import type { GeographyLevel } from "@/lib/market-map/geography";
import type {
  MarketMapFeatureProperties,
  MarketMapMetadata,
  MarketMapScaleMode,
} from "@/services/market-map/types";

// ---------------------------------------------------------------------------
// Extended FeatureCollection (includes metadata attached by the API)
// ---------------------------------------------------------------------------

export type MarketMapFeatureCollection = FeatureCollection<
  Geometry | null,
  MarketMapFeatureProperties
> & {
  metadata: MarketMapMetadata;
};

// ---------------------------------------------------------------------------
// Hook input
// ---------------------------------------------------------------------------

export type UseMarketMapInput = {
  /** Viewport bounding box [west, south, east, north]. Undefined while the map is initialising. */
  bbox?: [number, number, number, number];
  /** Current MapLibre zoom level. */
  zoom: number;
  /** Property type filter. */
  propertyType: "all" | "detached" | "semi-detached" | "terraced" | "flat";
  /** Number of trailing months to include (12 | 24 | 36 | 60). */
  months: 12 | 24 | 36 | 60;
  /** Whether colour buckets are national or local. */
  scaleMode: MarketMapScaleMode;
  /**
   * Override the geography level derived from zoom.
   * Leave undefined to use geographyLevelForZoom(zoom).
   */
  geographyLevel?: GeographyLevel;
};

// ---------------------------------------------------------------------------
// Hook output
// ---------------------------------------------------------------------------

export type UseMarketMapResult = {
  data: MarketMapFeatureCollection | undefined;
  isLoading: boolean;
  isError: boolean;
};

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

function buildMarketMapUrl(
  bbox: [number, number, number, number],
  zoom: number,
  propertyType: UseMarketMapInput["propertyType"],
  months: UseMarketMapInput["months"],
  scaleMode: MarketMapScaleMode,
  geographyLevel: GeographyLevel,
): string {
  const url = new URL("/api/market-map", window.location.origin);
  url.searchParams.set("bbox", bbox.join(","));
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("geography_level", geographyLevel);
  url.searchParams.set("property_type", propertyType);
  url.searchParams.set("months", String(months));
  url.searchParams.set("scale_mode", scaleMode);
  return url.toString();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches the choropleth FeatureCollection for the current viewport.
 *
 * Skips the query while bbox is undefined (map not yet loaded).
 * Debounces bbox + zoom by 300 ms so rapid panning does not produce a
 * request per animation frame.
 */
export function useMarketMap({
  bbox,
  zoom,
  propertyType,
  months,
  scaleMode,
  geographyLevel,
}: UseMarketMapInput): UseMarketMapResult {
  // Debounce the viewport inputs — stable filter values pass through instantly
  // because they live outside the debounced tuple.
  const [debouncedViewport] = useDebounce({ bbox, zoom }, 300);

  const resolvedGeographyLevel =
    geographyLevel ?? geographyLevelForZoom(debouncedViewport.zoom);

  const enabled = debouncedViewport.bbox !== undefined;

  const queryKey = [
    "market-map",
    debouncedViewport.bbox?.join(",") ?? "",
    debouncedViewport.zoom,
    resolvedGeographyLevel,
    propertyType,
    months,
    scaleMode,
  ] as const;

  const { data, isLoading, isError } = useQuery<MarketMapFeatureCollection>({
    queryKey,
    queryFn: async () => {
      // bbox is guaranteed non-undefined here because `enabled` gates execution
      const url = buildMarketMapUrl(
        debouncedViewport.bbox!,
        debouncedViewport.zoom,
        propertyType,
        months,
        scaleMode,
        resolvedGeographyLevel,
      );
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`market-map fetch failed: ${response.status}`);
      }
      return response.json() as Promise<MarketMapFeatureCollection>;
    },
    enabled,
    // Keep previous data visible while a new viewport fetch is in-flight so
    // the map does not flash blank on every pan.
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  return { data, isLoading, isError };
}
