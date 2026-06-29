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
import { Map as MapGL, Source, Layer, NavigationControl } from "@vis.gl/react-maplibre";
import type { MapRef, ViewStateChangeEvent, MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMarketMap } from "@/hooks/useMarketMap";
import { useMarketMapVersion } from "@/hooks/useMarketMapVersion";
import { colourForBucket, INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
import {
  colourForSoldBucket,
  SOLD_RAMP,
  SOLD_INSUFFICIENT_COLOUR,
  parseSoldParcelProperties,
  type SoldParcel,
} from "@/lib/market-map/sold-colour";
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
// Sold-properties layer — individual real Land-Registry sales snapped to their
// HM Land Registry INSPIRE title parcel, coloured by £/m². High zoom only
// (z >= 14): the area choropleth carries the map below street level, the sold
// parcels take over above it. Served by /api/market-map/sold (sold_parcels MVT).
// ---------------------------------------------------------------------------

const SOLD_SOURCE_ID = "sold-parcels";
const SOLD_TILE_LAYER = "sold_parcels";
const SOLD_FILL_LAYER_ID = "sold-parcels-fill";
const SOLD_STROKE_LAYER_ID = "sold-parcels-stroke";
/** Tiles + fill only appear at street zoom. Matches the RPC's z>=14 gate. */
const SOLD_MINZOOM = 14;

/** fill-color: baked £/m² bucket (1..9) → warm ramp; absent/null → neutral grey. */
const SOLD_FILL_COLOUR_EXPRESSION = [
  "match",
  ["get", "bucket"],
  1, colourForSoldBucket(1),
  2, colourForSoldBucket(2),
  3, colourForSoldBucket(3),
  4, colourForSoldBucket(4),
  5, colourForSoldBucket(5),
  6, colourForSoldBucket(6),
  7, colourForSoldBucket(7),
  8, colourForSoldBucket(8),
  9, colourForSoldBucket(9),
  SOLD_INSUFFICIENT_COLOUR,
] as const;

/**
 * Choropleth fill-opacity by zoom: full below street level, faded back once the
 * sold-parcel layer takes over (z>=14) so individual sales read clearly.
 */
const CHOROPLETH_FADE_OPACITY = [
  "interpolate", ["linear"], ["zoom"],
  13, 0.65,
  14, 0.45,
  16, 0.15,
] as const;

/** Sold-fill opacity: fades IN as the choropleth fades out. */
const SOLD_FILL_OPACITY = [
  "interpolate", ["linear"], ["zoom"],
  13.5, 0,
  14.5, 0.8,
] as const;

/** Required OGL attributions shown whenever HMLR/OS/EPC data is on screen. */
const SOLD_ATTRIBUTIONS = [
  "Contains HM Land Registry data © Crown copyright and database right 2026. Licensed under the Open Government Licence v3.0.",
  "© Crown copyright and database rights 2026 Ordnance Survey AC0000851063.",
  "Energy Performance of Buildings Data © Crown copyright 2026.",
].join(" | ");

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
  onAreaSelect?: (
    props: MarketMapFeatureProperties | null,
    anchor?: { longitude: number; latitude: number },
  ) => void;
  /** Fired when a sold parcel is clicked (street zoom), or null to clear it
   *  when empty space or an area is clicked. Parent renders the detail in the panel. */
  onParcelSelect?: (parcel: SoldParcel | null) => void;
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
  onParcelSelect,
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
  // fitTo: fly/fit when prop changes — and re-apply on load, since the map may
  // mount with fitTo already set (e.g. /area-prices flies to a postcode the
  // moment the result renders), where the camera move would otherwise fire
  // before the style finishes loading and be lost.
  // ---------------------------------------------------------------------------

  const fitToRef = useRef<FitBoundsParams | null>(fitTo ?? null);
  useEffect(() => {
    fitToRef.current = fitTo ?? null;
  }, [fitTo]);

  const applyFit = useCallback((params: FitBoundsParams) => {
    const map = mapRef.current;
    if (!map) return;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    map.fitBounds(params.bounds, {
      padding: 40,
      duration: reducedMotion ? 0 : 800,
      maxZoom: params.zoom,
    });
  }, []);

  useEffect(() => {
    if (fitTo) applyFit(fitTo);
  }, [fitTo, applyFit]);

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

  // Capture initial bbox once the map loads, and apply any fitTo that was set
  // before the style finished loading.
  const handleLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    const bbox = extractBbox(map);
    setViewport({ zoom, bbox });
    onViewportChange?.({ zoom, bbox });
    if (fitToRef.current) applyFit(fitToRef.current);
    // Test handle: lets E2E drive the live map (fly + queryRenderedFeatures).
    if (typeof window !== "undefined") {
      (window as unknown as { __marketMapRef?: unknown }).__marketMapRef = map.getMap();
    }
  }, [onViewportChange, applyFit]);

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

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // Sold parcels take click priority at street zoom: report to the parent.
      const soldFeature = e.features?.find((f) => f.layer?.id === SOLD_FILL_LAYER_ID);
      if (soldFeature?.properties) {
        const parcel = parseSoldParcelProperties(
          soldFeature.properties as Record<string, unknown>,
        );
        if (parcel) {
          onParcelSelect?.(parcel);
          return;
        }
      }

      // Any non-parcel click clears a prior parcel selection in the parent.
      onParcelSelect?.(null);

      const feature = e.features?.find((f) => f.layer?.id === FILL_LAYER_ID) as
        | (MapGeoJSONFeature & { properties: TileFeatureProperties })
        | undefined;
      if (!feature?.properties?.area_id) {
        setSelectedAreaId(null);
        onAreaSelect?.(null);
        return;
      }
      setSelectedAreaId(feature.properties.area_id);
      onAreaSelect?.(resolveProperties(feature.properties), {
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
      });
    },
    [onAreaSelect, onParcelSelect, resolveProperties],
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
  const soldTileUrl = `${origin}/api/market-map/sold/{z}/{x}/{y}?v=${dataVersion}`;

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
        attributionControl={{ customAttribution: SOLD_ATTRIBUTIONS }}
        interactiveLayerIds={[SOLD_FILL_LAYER_ID, FILL_LAYER_ID]}
        onMoveEnd={handleMoveEnd}
        onZoomEnd={handleMoveEnd}
        onLoad={handleLoad}
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
              "fill-opacity": CHOROPLETH_FADE_OPACITY as unknown as number,
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

        {/*
         * Sold-properties source — individual Land-Registry sales snapped to
         * their INSPIRE parcel, cached MVT from /api/market-map/sold (z>=14).
         * Sparse, so tiles are tiny. The full sale list rides in each feature
         * (`sales`), so the click popup needs no extra fetch.
         */}
        <Source
          id={SOLD_SOURCE_ID}
          type="vector"
          tiles={[soldTileUrl]}
          minzoom={SOLD_MINZOOM}
          maxzoom={TILE_MAXZOOM}
        >
          <Layer
            id={SOLD_FILL_LAYER_ID}
            type="fill"
            source={SOLD_SOURCE_ID}
            source-layer={SOLD_TILE_LAYER}
            minzoom={SOLD_MINZOOM}
            paint={{
              "fill-color": SOLD_FILL_COLOUR_EXPRESSION as unknown as string,
              "fill-opacity": SOLD_FILL_OPACITY as unknown as number,
            }}
          />
          <Layer
            id={SOLD_STROKE_LAYER_ID}
            type="line"
            source={SOLD_SOURCE_ID}
            source-layer={SOLD_TILE_LAYER}
            minzoom={SOLD_MINZOOM}
            paint={{
              "line-color": "rgba(40,20,10,0.55)",
              "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.3, 18, 1.2] as unknown as number,
            }}
          />
        </Source>
      </MapGL>

      {/* Street-zoom legend for the sold-parcel £/m² ramp (only while active). */}
      {viewport.zoom >= SOLD_MINZOOM && (
        <div
          role="img"
          aria-label="Sold price per square metre legend, low to high"
          className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-white/95 px-3 py-2 shadow-md ring-1 ring-black/5 backdrop-blur"
        >
          <p className="text-xs font-semibold text-neutral-800">Sold £/m²</p>
          <p className="mb-1 text-[10px] text-neutral-500">Each parcel = real sales</p>
          <div className="flex h-2 w-40 overflow-hidden rounded-full">
            {SOLD_RAMP.map((hex) => (
              <span
                key={hex}
                className="flex-1"
                style={{ backgroundColor: hex }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="mt-0.5 flex justify-between text-[10px] text-neutral-500">
            <span>Lower</span>
            <span>Higher</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: SOLD_INSUFFICIENT_COLOUR }}
              aria-hidden="true"
            />
            <span className="text-[10px] text-neutral-500">No floor area</span>
          </div>
        </div>
      )}
    </div>
  );
}
