"use client";

/**
 * MarketMap — choropleth canvas for the multi-scale property price map.
 *
 * Uses @vis.gl/react-maplibre v8 (declarative Map / Source / Layer / Popup).
 * The choropleth fill is rendered from cached MapLibre vector tiles
 * (GET /api/market-map/tiles/{z}/{x}/{y}?v=<dataVersion>, layer "areas") and
 * coloured client-side from the baked `bucket` prop via colourForBucket();
 * INSUFFICIENT_COLOUR for null/absent buckets.
 *
 * Per-area rich stats (area_name, p10/p90, property_type_mix, confidence, date
 * window) are NOT carried in the tiles — they still come from /api/market-map
 * via useMarketMap, which also feeds the "Areas in view" list and the legend.
 * Hover/click look up the full properties by area_id from that collection and
 * fall back to a minimal record synthesised from the tile feature props.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Map as MapGL, Source, Layer, Popup, NavigationControl } from "@vis.gl/react-maplibre";
import type { MapRef, ViewStateChangeEvent, MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMarketMap } from "@/hooks/useMarketMap";
import { useMarketMapVersion } from "@/hooks/useMarketMapVersion";
import { MarketMapTooltip } from "./MarketMapTooltip";
import { colourForBucket, INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
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

/** Vector-tile source bounds. MapLibre overzooms past maxzoom for fine levels. */
const TILE_MINZOOM = 4;
const TILE_MAXZOOM = 16;

// ---------------------------------------------------------------------------
// Source / Layer IDs
// ---------------------------------------------------------------------------

const SOURCE_ID = "market-map";
/** MVT layer name baked by the market_map_tile RPC. */
const TILE_SOURCE_LAYER = "areas";
const FILL_LAYER_ID = "market-map-fill";
const STROKE_LAYER_ID = "market-map-stroke";
const SELECTED_STROKE_LAYER_ID = "market-map-selected-stroke";

// ---------------------------------------------------------------------------
// fill-color: match the baked bucket (1..9) to its hex; null/absent → grey.
// ---------------------------------------------------------------------------

const FILL_COLOUR_EXPRESSION = [
  "match",
  ["get", "bucket"],
  1, colourForBucket(1),
  2, colourForBucket(2),
  3, colourForBucket(3),
  4, colourForBucket(4),
  5, colourForBucket(5),
  6, colourForBucket(6),
  7, colourForBucket(7),
  8, colourForBucket(8),
  9, colourForBucket(9),
  INSUFFICIENT_COLOUR,
] as const;

/** Feature props carried in the MVT `areas` layer (baked by market_map_tile). */
type TileFeatureProperties = {
  area_id: string;
  bucket?: number | null;
  median_price_pence?: number;
  transaction_count?: number;
};

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

  // Tile cache-buster — fetched once, falls back to "0" until resolved.
  const dataVersion = useMarketMapVersion();

  // area_id → full feature properties, used to enrich tile hover/click. Tiles
  // only carry area_id/bucket/median_price_pence/transaction_count.
  const propsByAreaId = useMemo(() => {
    const map = new Map<string, MarketMapFeatureProperties>();
    for (const f of featureCollection?.features ?? []) {
      if (f.properties) map.set(f.properties.area_id, f.properties);
    }
    return map;
  }, [featureCollection]);

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
  // Mouse interaction on the fill layer (tile features)
  // ---------------------------------------------------------------------------

  // Resolve full feature properties for a hovered/clicked tile feature. Tiles
  // carry only area_id/bucket/median_price_pence/transaction_count, so prefer
  // the rich record from useMarketMap (keyed by area_id) and fall back to a
  // minimal synthesised record when the GeoJSON layer has not loaded that area.
  const resolveProperties = useCallback(
    (tile: TileFeatureProperties): MarketMapFeatureProperties => {
      const enriched = propsByAreaId.get(tile.area_id);
      if (enriched) return enriched;

      const medianPounds =
        tile.median_price_pence !== undefined
          ? Math.round(tile.median_price_pence / 100)
          : 0;
      return {
        area_id: tile.area_id,
        area_name: null,
        geography_level: "",
        median_price: medianPounds,
        p10_price: 0,
        p90_price: 0,
        transaction_count: tile.transaction_count ?? 0,
        latest_transaction_date: null,
        confidence:
          tile.bucket === null || tile.bucket === undefined
            ? "Insufficient"
            : "Low",
        colour_bucket: tile.bucket ?? null,
        fill_colour:
          tile.bucket === null || tile.bucket === undefined
            ? INSUFFICIENT_COLOUR
            : colourForBucket(tile.bucket),
        scale_mode: scaleMode,
        date_from: "",
        date_to: "",
        property_type_mix: {},
      };
    },
    [propsByAreaId, scaleMode],
  );

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0] as (MapGeoJSONFeature & { properties: TileFeatureProperties }) | undefined;
      if (!feature?.properties?.area_id) {
        setTooltip(null);
        return;
      }
      setTooltip({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        properties: resolveProperties(feature.properties),
      });
    },
    [resolveProperties],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0] as (MapGeoJSONFeature & { properties: TileFeatureProperties }) | undefined;
      if (!feature?.properties?.area_id) {
        setSelectedAreaId(null);
        onAreaSelect?.(null);
        return;
      }
      setSelectedAreaId(feature.properties.area_id);
      onAreaSelect?.(resolveProperties(feature.properties));
    },
    [onAreaSelect, resolveProperties],
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
  // Vector-tile URL template — absolute, cache-busted by the data version.
  // ---------------------------------------------------------------------------

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const tileUrl = `${origin}/api/market-map/tiles/{z}/{x}/{y}?v=${dataVersion}`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("relative w-full h-full", className)}>
      <MapGL
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

        {/*
         * Choropleth source — cached MapLibre vector tiles from
         * /api/market-map/tiles. minzoom/maxzoom bound tile generation;
         * MapLibre overzooms past maxzoom for fine geography levels.
         */}
        <Source
          id={SOURCE_ID}
          type="vector"
          tiles={[tileUrl]}
          minzoom={TILE_MINZOOM}
          maxzoom={TILE_MAXZOOM}
        >
          {/*
           * Fill layer: coloured from the baked `bucket` prop (1..9) via
           * colourForBucket; INSUFFICIENT_COLOUR for null/absent buckets.
           * Opacity matches the previous GeoJSON layer (DESIGN.md §4.3).
           */}
          <Layer
            id={FILL_LAYER_ID}
            type="fill"
            source={SOURCE_ID}
            source-layer={TILE_SOURCE_LAYER}
            paint={{
              "fill-color": FILL_COLOUR_EXPRESSION as unknown as string,
              "fill-opacity": 0.65,
            }}
          />

          {/* Outline layer: subtle white stroke per DESIGN.md §4.4. */}
          <Layer
            id={STROKE_LAYER_ID}
            type="line"
            source={SOURCE_ID}
            source-layer={TILE_SOURCE_LAYER}
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
            source-layer={TILE_SOURCE_LAYER}
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
      </MapGL>
    </div>
  );
}
