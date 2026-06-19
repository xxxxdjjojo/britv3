"use client";

/**
 * MarketMap — choropleth canvas for the multi-scale property price map.
 *
 * Uses @vis.gl/react-maplibre v8 (declarative Map / Source / Layer / Popup).
 * Fetches viewport-scoped GeoJSON from /api/market-map via useMarketMap.
 * Fill colours are server-computed (fill_colour property); grey fallback
 * (#9E9EAB) for areas with insufficient data.
 *
 * // TODO(pmtiles): At national zoom levels (<7) a PMTiles source could replace
 * // or augment the GeoJSON source for better performance once ONS boundary
 * // tiles are generated. Swap the <Source type="geojson"> for a
 * // <Source type="vector" url="pmtiles://..."> and update the Layer
 * // source-layer prop. The pmtiles package is NOT currently installed.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { Map, Source, Layer, Popup, NavigationControl } from "@vis.gl/react-maplibre";
import type { MapRef, ViewStateChangeEvent, MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMarketMap } from "@/hooks/useMarketMap";
import { MarketMapTooltip } from "./MarketMapTooltip";
import type { MarketMapFeatureProperties, MarketMapScaleMode, MarketMapMetadata } from "@/services/market-map/types";
import type { FitBoundsParams } from "@/lib/market-map/fit-bounds";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants — mirror SearchMap.tsx conventions exactly
// ---------------------------------------------------------------------------

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const UK_CENTER: [number, number] = [-2, 54.5];
const DEFAULT_ZOOM = 6;

/** Insufficient-data fill colour per DESIGN.md §4.2 */
const GREY_FALLBACK = "#9E9EAB";

// ---------------------------------------------------------------------------
// Source / Layer IDs
// ---------------------------------------------------------------------------

const SOURCE_ID = "market-areas";
const FILL_LAYER_ID = "market-areas-fill";
const STROKE_LAYER_ID = "market-areas-stroke";
const SELECTED_STROKE_LAYER_ID = "market-areas-selected-stroke";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type MarketMapProps = Readonly<{
  propertyType: "all" | "detached" | "semi-detached" | "terraced" | "flat";
  months: 12 | 24 | 36 | 60;
  scaleMode: MarketMapScaleMode;
  /** When non-null, the map flies/fits to these bounds. */
  fitTo?: FitBoundsParams | null;
  onViewportChange?: (v: { zoom: number; bbox: [number, number, number, number] }) => void;
  onAreaSelect?: (props: MarketMapFeatureProperties | null) => void;
  /** Surfaces metadata (scale_mode, band_label) to parent. */
  onMetadata?: (m: MarketMapMetadata) => void;
  /**
   * Fired whenever the viewport GeoJSON data updates. Provides the full
   * FeatureCollection so callers can populate the area list without a
   * duplicate fetch.
   */
  onFeatures?: (fc: import("@/hooks/useMarketMap").MarketMapFeatureCollection) => void;
  className?: string;
}>;

// ---------------------------------------------------------------------------
// Hover/tooltip state
// ---------------------------------------------------------------------------

type TooltipState = {
  longitude: number;
  latitude: number;
  properties: MarketMapFeatureProperties;
};

// ---------------------------------------------------------------------------
// Helper: extract bbox from MapRef
// ---------------------------------------------------------------------------

function extractBbox(mapRef: MapRef): [number, number, number, number] {
  const bounds = mapRef.getBounds();
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketMap({
  propertyType,
  months,
  scaleMode,
  fitTo,
  onViewportChange,
  onAreaSelect,
  onMetadata,
  onFeatures,
  className,
}: MarketMapProps) {
  const mapRef = useRef<MapRef>(null);

  // Internal viewport state — drives the data hook
  const [viewport, setViewport] = useState<{
    zoom: number;
    bbox?: [number, number, number, number];
  }>({ zoom: DEFAULT_ZOOM });

  // Hover tooltip state
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Selected area id (for highlight layer filter)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data hook
  // ---------------------------------------------------------------------------

  const { data: featureCollection } = useMarketMap({
    bbox: viewport.bbox,
    zoom: viewport.zoom,
    propertyType,
    months,
    scaleMode,
  });

  // Surface metadata + features to parent when data changes
  useEffect(() => {
    if (!featureCollection) return;
    if (onMetadata) {
      onMetadata(featureCollection.metadata);
    }
    if (onFeatures) {
      onFeatures(featureCollection);
    }
  }, [featureCollection, onMetadata, onFeatures]);

  // ---------------------------------------------------------------------------
  // fitTo: fly/fit when prop changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!fitTo || !mapRef.current) return;
    const map = mapRef.current;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    map.fitBounds(fitTo.bounds, {
      padding: 40,
      duration: reducedMotion ? 0 : 800,
      maxZoom: fitTo.zoom,
    });
  }, [fitTo]);

  // ---------------------------------------------------------------------------
  // Viewport callbacks
  // ---------------------------------------------------------------------------

  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      const map = mapRef.current;
      if (!map) return;
      const zoom = e.viewState.zoom;
      const bbox = extractBbox(map);
      setViewport({ zoom, bbox });
      onViewportChange?.({ zoom, bbox });
    },
    [onViewportChange],
  );

  // Capture initial bbox once the map loads
  const handleLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    const bbox = extractBbox(map);
    setViewport({ zoom, bbox });
    onViewportChange?.({ zoom, bbox });
  }, [onViewportChange]);

  // ---------------------------------------------------------------------------
  // Mouse interaction on the fill layer
  // ---------------------------------------------------------------------------

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0] as (MapGeoJSONFeature & { properties: MarketMapFeatureProperties }) | undefined;
    if (!feature?.properties) {
      setTooltip(null);
      return;
    }
    // property_type_mix arrives as a JSON string when coming through MapLibre
    // feature serialisation — parse it back if needed.
    const props = feature.properties;
    const mix: Record<string, number> =
      typeof props.property_type_mix === "string"
        ? (JSON.parse(props.property_type_mix) as Record<string, number>)
        : props.property_type_mix;

    setTooltip({
      longitude: e.lngLat.lng,
      latitude: e.lngLat.lat,
      properties: { ...props, property_type_mix: mix },
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0] as (MapGeoJSONFeature & { properties: MarketMapFeatureProperties }) | undefined;
      if (!feature?.properties) {
        setSelectedAreaId(null);
        onAreaSelect?.(null);
        return;
      }
      const props = feature.properties;
      const mix: Record<string, number> =
        typeof props.property_type_mix === "string"
          ? (JSON.parse(props.property_type_mix) as Record<string, number>)
          : props.property_type_mix;
      const fullProps: MarketMapFeatureProperties = { ...props, property_type_mix: mix };
      setSelectedAreaId(props.area_id);
      onAreaSelect?.(fullProps);
    },
    [onAreaSelect],
  );

  // ---------------------------------------------------------------------------
  // Graceful fallback when MapTiler key is absent
  // ---------------------------------------------------------------------------

  if (!MAPTILER_KEY) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-lg bg-neutral-100",
          className,
        )}
      >
        <p className="text-sm text-neutral-500">
          Map unavailable — MapTiler API key not configured.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GeoJSON source data — empty FeatureCollection while loading
  // ---------------------------------------------------------------------------

  // The Source component accepts any GeoJSON FeatureCollection shape.
  // Cast to satisfy the geojson package's stricter Geometry (no null) constraint
  // while preserving the actual runtime value — MapLibre handles null geometries fine.
  const sourceData = (featureCollection ?? {
    type: "FeatureCollection" as const,
    features: [],
  }) as GeoJSON.FeatureCollection;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Map
        ref={mapRef}
        mapStyle={STREETS_STYLE}
        initialViewState={{
          longitude: UK_CENTER[0],
          latitude: UK_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        interactiveLayerIds={[FILL_LAYER_ID]}
        onMoveEnd={handleMoveEnd}
        onZoomEnd={handleMoveEnd}
        onLoad={handleLoad}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Navigation controls — top-right to avoid overlapping the detail card at bottom-right */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Choropleth source — viewport-scoped GeoJSON from /api/market-map */}
        {/* TODO(pmtiles): replace with <Source type="vector" url="pmtiles://..."> */}
        {/* once ONS boundary tiles are generated and the pmtiles package is added. */}
        <Source id={SOURCE_ID} type="geojson" data={sourceData}>
          {/*
           * Fill layer: uses server-computed fill_colour per DESIGN.md §4.
           * Grey fallback (#9E9EAB) for insufficient-data areas.
           * Default opacity 65% per DESIGN.md §4.3.
           */}
          <Layer
            id={FILL_LAYER_ID}
            type="fill"
            source={SOURCE_ID}
            paint={{
              "fill-color": ["coalesce", ["get", "fill_colour"], GREY_FALLBACK],
              "fill-opacity": [
                "case",
                ["==", ["get", "confidence"], "Insufficient"],
                0.5,
                0.65,
              ],
            }}
          />

          {/*
           * Outline layer: subtle white stroke per DESIGN.md §4.4.
           * Hover state handled via MapLibre feature-state where supported,
           * but opacity is pre-baked here for broad compatibility.
           */}
          <Layer
            id={STROKE_LAYER_ID}
            type="line"
            source={SOURCE_ID}
            paint={{
              "line-color": "rgba(255,255,255,0.4)",
              "line-width": 0.5,
            }}
          />

          {/*
           * Selected area highlight: thicker white stroke on the clicked area.
           * Filter matches area_id of the currently selected feature.
           */}
          <Layer
            id={SELECTED_STROKE_LAYER_ID}
            type="line"
            source={SOURCE_ID}
            filter={
              selectedAreaId !== null
                ? ["==", ["get", "area_id"], selectedAreaId]
                : ["==", ["get", "area_id"], ""]
            }
            paint={{
              "line-color": "#FFFFFF",
              "line-width": 2,
            }}
          />
        </Source>

        {/* Hover tooltip */}
        {tooltip !== null && (
          <Popup
            longitude={tooltip.longitude}
            latitude={tooltip.latitude}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            maxWidth="300px"
          >
            <MarketMapTooltip properties={tooltip.properties} />
          </Popup>
        )}
      </Map>
    </div>
  );
}
