"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
const UK_CENTER: [number, number] = [-2, 54.5];
const DEFAULT_ZOOM = 6;

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
  const styleBtnRef = useRef<HTMLButtonElement | null>(null);

  const [status, setStatus] = useState<MapStatus>(
    MAPTILER_KEY ? "loading" : "error",
  );

  // Stable callback refs to avoid stale closures in event listeners.
  // Kept in sync inside an effect (not during render) to satisfy react-hooks/refs.
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onPropertyClickRef = useRef(onPropertyClick);
  const onProviderClickRef = useRef(onProviderClick);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPropertyClickRef.current = onPropertyClick;
    onProviderClickRef.current = onProviderClick;
  });

  // Visible (valid-coordinate) property count drives the deterministic test id.
  const visibleMarkerCount = properties.filter((p) =>
    hasValidCoords(p.lat, p.lng),
  ).length;

  // -----------------------------------------------------------------------
  // Initialize map
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPTILER_KEY) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STREETS_STYLE,
        center: UK_CENTER,
        zoom: DEFAULT_ZOOM,
      });
    } catch {
      // Defer out of the effect body to avoid a synchronous cascading render.
      queueMicrotask(() => setStatus("error"));
      return;
    }

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    map.on("load", () => setStatus("loaded"));
    map.on("error", () => setStatus("error"));
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
    map.setStyle(next ? SATELLITE_STYLE : STREETS_STYLE);

    if (styleBtnRef.current) {
      styleBtnRef.current.textContent = next ? "Standard" : "Satellite";
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

  // Guard: show fallback if MapTiler API key is not configured.
  if (!MAPTILER_KEY) {
    return (
      <div
        data-testid="search-map"
        className={`flex h-full items-center justify-center rounded-lg bg-muted ${className ?? ""}`}
      >
        {statusProbes}
        <p className="text-sm text-muted-foreground">
          Map unavailable — MapTiler API key not configured.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="search-map"
      className={`relative w-full h-full ${className ?? ""}`}
    >
      {statusProbes}

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Recoverable error overlay */}
      {reportedStatus === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted/90 text-center">
          <p className="text-sm text-muted-foreground">
            The map could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => setStatus(MAPTILER_KEY ? "loading" : "error")}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Control buttons — top-right */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <button
          ref={styleBtnRef}
          type="button"
          onClick={handleStyleToggle}
          className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={handleFullscreenToggle}
          className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
}

export default SearchMap;
