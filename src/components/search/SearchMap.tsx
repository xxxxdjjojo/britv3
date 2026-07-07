"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  POI_CATEGORIES,
  ALL_POI_KEYS,
  poiCircleLayerSpec,
  poiTextLayerSpec,
  type PoiCategoryKey,
} from "@/lib/map/poi-categories";
import { MapPoiPanel } from "@/components/map/MapPoiPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MapBounds = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};

export type MapProperty = {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  thumbnailUrl: string | null;
  listing_type?: string;
};

export type MapProvider = {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  rating: number | null;
};

export type MapStatus = "loading" | "loaded" | "empty" | "error";

export type SearchMapProps = Readonly<{
  properties: MapProperty[];
  providers: MapProvider[];
  onPropertyClick: (property: MapProperty) => void;
  onProviderClick: (provider: MapProvider) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  /** Id of the currently selected listing — its marker is highlighted/centred. */
  selectedId?: string | null;
  className?: string;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
// Standard basemap = committed pastel 3D vector style (openmaptiles source →
// supports the POI category layers). Keyless; no MapTiler request.
const STANDARD_STYLE = "/map/truedeed-style.json";
const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
const UK_CENTER: [number, number] = [-2, 54.5];
const DEFAULT_ZOOM = 6;

// Keyless raster fallback (same MapLibre renderer, no API key). Used when the
// MapTiler key is absent or rejected (e.g. origin-restricted -> 403) so the map
// area degrades to a real base map instead of a dead error box.
const OSM_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const MARKER_DEFAULT = "#1B4D3E";
const MARKER_SELECTED = "#fdcd74";
const MARKER_PROVIDER = "#5d7d72";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasValidCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function createMarkerElement(color: string, size: number): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "50%";
  el.style.backgroundColor = color;
  el.style.border = "2px solid white";
  el.style.cursor = "pointer";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
  return el;
}

function extractBounds(map: maplibregl.Map): MapBounds {
  const bounds = map.getBounds();
  return {
    sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
    ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
  };
}

/**
 * Add/remove POI category layers on the standard (openmaptiles) basemap to match
 * `enabled`. No-op unless the map's style has the "openmaptiles" source — the
 * satellite and OSM-raster styles do not, so POIs simply don't exist there.
 *
 * Exported for unit testing against a fake map (getSource/getLayer/addLayer/
 * removeLayer spies).
 */
export function syncPoiLayers(
  map: maplibregl.Map,
  enabled: ReadonlySet<PoiCategoryKey>,
): void {
  // Guard: skip entirely on styles without the vector POI source.
  if (!map.getSource("openmaptiles")) return;

  for (const category of POI_CATEGORIES) {
    const circleId = `poi-${category.key}-circle`;
    const labelId = `poi-${category.key}-label`;
    const isOn = enabled.has(category.key);

    if (isOn) {
      // Append on top → renders above buildings.
      if (!map.getLayer(circleId)) map.addLayer(poiCircleLayerSpec(category));
      if (!map.getLayer(labelId)) map.addLayer(poiTextLayerSpec(category));
    } else {
      if (map.getLayer(labelId)) map.removeLayer(labelId);
      if (map.getLayer(circleId)) map.removeLayer(circleId);
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SearchMap({
  properties,
  providers,
  onPropertyClick,
  onProviderClick,
  onBoundsChange,
  selectedId = null,
  className,
}: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const isSatelliteRef = useRef(false);
  // Latest POI selection, read inside imperative map callbacks (load / styledata)
  // without re-running the once-only init effect.
  const enabledPoiRef = useRef<Set<PoiCategoryKey>>(new Set(ALL_POI_KEYS));
  // Guard so we only fall back to the keyless base map once (tile errors fire
  // repeatedly otherwise).
  const usedFallbackRef = useRef(false);

  const [status, setStatus] = useState<MapStatus>("loading");
  const [styleLabel, setStyleLabel] = useState<"Satellite" | "Standard">("Satellite");
  // React-visible mirror of isSatelliteRef so the POI panel can hide on satellite.
  const [isSatellite, setIsSatellite] = useState(false);
  // POI category filter — all on by default. Immutable functional updates.
  const [enabledPoi, setEnabledPoi] = useState<Set<PoiCategoryKey>>(
    () => new Set(ALL_POI_KEYS),
  );
  const togglePoi = useCallback((key: PoiCategoryKey) => {
    setEnabledPoi((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);
  // True once we're on the keyless OSM base (no MapTiler key, or it was
  // rejected). The MapTiler-only Satellite style would just 403 again and blank
  // a working fallback map, so we hide that toggle while on OSM.
  // True once the map has degraded to the keyless OSM raster (a MapTiler tile
  // error). The map now *starts* on the keyless standard vector style, so this
  // is only ever set by the error handler — not at init.
  const [onFallback, setOnFallback] = useState(false);

  // Stable callback refs to avoid stale closures in event listeners.
  // Kept in sync inside an effect (not during render) to satisfy react-hooks/refs.
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onPropertyClickRef = useRef(onPropertyClick);
  const onProviderClickRef = useRef(onProviderClick);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPropertyClickRef.current = onPropertyClick;
    onProviderClickRef.current = onProviderClick;
    enabledPoiRef.current = enabledPoi;
  });

  // Visible (valid-coordinate) property count drives the deterministic test id.
  const visibleMarkerCount = properties.filter((p) =>
    hasValidCoords(p.lat, p.lng),
  ).length;

  // -----------------------------------------------------------------------
  // Initialize map
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Standard basemap is the keyless local vector style; it does not depend on
    // the MapTiler key (only the Satellite toggle does).
    const initialStyle: string | StyleSpecification = STANDARD_STYLE;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: initialStyle,
        center: UK_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 45,
        bearing: 0,
        cooperativeGestures: true,
      });
    } catch {
      // Defer out of the effect body to avoid a synchronous cascading render.
      queueMicrotask(() => setStatus("error"));
      return;
    }

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: true,
      }),
      "bottom-right",
    );

    map.on("load", () => {
      setStatus("loaded");
      // Standard style is active on load → add the POI category layers.
      syncPoiLayers(map, enabledPoiRef.current);
    });
    map.on("error", () => {
      // Only the satellite basemap (MapTiler) genuinely hard-fails without a
      // key. On the keyless standard OpenFreeMap style, transient tile/glyph
      // errors are self-healing (maplibre re-requests on pan) — do NOT demote
      // the whole session to the OSM raster fallback.
      if (!isSatelliteRef.current) {
        return;
      }
      // First MapTiler failure (e.g. 403 origin restriction): switch once to
      // the keyless OSM base map and keep the map usable. If the fallback also
      // errors, surface the recoverable error state.
      if (!usedFallbackRef.current) {
        usedFallbackRef.current = true;
        try {
          map.setStyle(OSM_FALLBACK_STYLE);
          setOnFallback(true);
          isSatelliteRef.current = false;
          setIsSatellite(false);
          setStyleLabel("Satellite");
          setStatus("loaded");
        } catch {
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    });
    map.on("moveend", () => {
      onBoundsChangeRef.current(extractBounds(map));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Sync property & provider markers (keyed by stable listing/provider id)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current = new Map();

    for (const p of properties) {
      if (!hasValidCoords(p.lat, p.lng)) continue;
      const isSelected = p.id === selectedId;
      const el = createMarkerElement(
        isSelected ? MARKER_SELECTED : MARKER_DEFAULT,
        isSelected ? 16 : 12,
      );
      el.title = p.address;
      el.setAttribute("data-marker-id", p.id);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPropertyClickRef.current(p);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.set(p.id, marker);
    }

    for (const p of providers) {
      if (!hasValidCoords(p.lat, p.lng)) continue;
      const el = createMarkerElement(MARKER_PROVIDER, 10);
      el.title = p.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onProviderClickRef.current(p);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.set(`provider-${p.id}`, marker);
    }
  }, [properties, providers, selectedId]);

  // -----------------------------------------------------------------------
  // Centre the map on the selected listing (card -> marker sync)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const selected = properties.find(
      (p) => p.id === selectedId && hasValidCoords(p.lat, p.lng),
    );
    if (selected) {
      map.easeTo({ center: [selected.lng, selected.lat], duration: 600 });
    }
  }, [selectedId, properties]);

  // -----------------------------------------------------------------------
  // Style toggle handler
  // -----------------------------------------------------------------------
  const handleStyleToggle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const next = !isSatelliteRef.current;
    isSatelliteRef.current = next;
    setIsSatellite(next);
    // setStyle wipes all runtime layers. Switching *to* the standard style needs
    // the POI layers re-added once the new style's source is ready.
    map.setStyle(next ? SATELLITE_STYLE : STANDARD_STYLE);
    setStyleLabel(next ? "Standard" : "Satellite");
    if (!next) {
      map.once("styledata", () => {
        // Guard: only when the standard vector source has actually loaded.
        if (map.getSource("openmaptiles")) {
          syncPoiLayers(map, enabledPoiRef.current);
        }
      });
    }
  }, []);

  // -----------------------------------------------------------------------
  // Fullscreen toggle handler
  // -----------------------------------------------------------------------
  const handleFullscreenToggle = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  // -----------------------------------------------------------------------
  // React → map bridge: apply POI category toggles to the live standard style.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    // Only when a map exists and we're on the POI-capable standard style.
    if (!map || isSatellite || onFallback) return;
    if (!map.isStyleLoaded() || !map.getSource("openmaptiles")) return;
    syncPoiLayers(map, enabledPoi);
  }, [enabledPoi, isSatellite, onFallback]);

  // Resolve the status surfaced to the e2e contract: a loaded map with zero
  // valid markers is reported as "empty" (an honest, recoverable state).
  const reportedStatus: MapStatus =
    status === "loaded" && visibleMarkerCount === 0 ? "empty" : status;

  // Hidden, deterministic state probes for e2e.
  const statusProbes = (
    <>
      <span data-testid="search-map-status" className="sr-only">
        {reportedStatus}
      </span>
      <span data-testid="visible-map-marker-count" className="sr-only">
        {visibleMarkerCount}
      </span>
    </>
  );

  return (
    <div
      data-testid="search-map"
      className={`relative w-full h-full ${className ?? ""}`}
    >
      {statusProbes}

      {/* Map container — focusable so MapLibre's keyboard pan/zoom is reachable */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive map of property locations"
        className="w-full h-full"
      />

      {/* POI category filter — standard basemap only. Hidden on satellite (no
          openmaptiles source) and on the OSM raster fallback. */}
      {!isSatellite && !onFallback && (
        <MapPoiPanel
          enabled={enabledPoi}
          onToggle={togglePoi}
          className="absolute left-3 top-3 z-10 w-52 max-w-[60%]"
        />
      )}

      {/* Recoverable error overlay */}
      {reportedStatus === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted/90 text-center">
          <p className="text-sm text-muted-foreground">
            The map could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => {
              const map = mapRef.current;
              setStatus("loading");
              if (map) {
                usedFallbackRef.current = true;
                try {
                  map.setStyle(OSM_FALLBACK_STYLE);
                  setOnFallback(true);
                  setStatus("loaded");
                } catch {
                  setStatus("error");
                }
              }
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Control buttons — top-right. The Satellite toggle needs a MapTiler key
          and is hidden on the keyless OSM fallback (a satellite swap would just
          403). The standard basemap itself is keyless. */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        {MAPTILER_KEY && !onFallback && (
          <button
            type="button"
            onClick={handleStyleToggle}
            aria-label={`Switch to ${styleLabel === "Satellite" ? "satellite" : "standard"} map`}
            className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
          >
            {styleLabel}
          </button>
        )}
        <button
          type="button"
          onClick={handleFullscreenToggle}
          aria-label="Toggle fullscreen map"
          className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
}

export default SearchMap;
