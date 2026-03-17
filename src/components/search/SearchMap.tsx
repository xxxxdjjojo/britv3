"use client";

import { useEffect, useRef, useCallback } from "react";
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

export type SearchMapProps = Readonly<{
  properties: MapProperty[];
  providers: MapProvider[];
  onPropertyClick: (property: MapProperty) => void;
  onProviderClick: (provider: MapProvider) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  className?: string;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;
const UK_CENTER: [number, number] = [-2, 54.5];
const DEFAULT_ZOOM = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMarkerElement(
  color: string,
  size: number,
): HTMLDivElement {
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
  className,
}: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const isSatelliteRef = useRef(false);
  const styleBtnRef = useRef<HTMLButtonElement | null>(null);

  // Stable callback refs to avoid stale closures in event listeners
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const onPropertyClickRef = useRef(onPropertyClick);
  onPropertyClickRef.current = onPropertyClick;

  const onProviderClickRef = useRef(onProviderClick);
  onProviderClickRef.current = onProviderClick;

  // -----------------------------------------------------------------------
  // Initialize map
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREETS_STYLE,
      center: UK_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    map.on("moveend", () => {
      onBoundsChangeRef.current(extractBounds(map));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Sync property & provider markers
  // -----------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];

    // Add property markers (green, 12px)
    for (const p of properties) {
      const el = createMarkerElement("#22c55e", 12);
      el.title = p.address;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPropertyClickRef.current(p);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Add provider markers (blue, 10px)
    for (const p of providers) {
      const el = createMarkerElement("#3b82f6", 10);
      el.title = p.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onProviderClickRef.current(p);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [properties, providers]);

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

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div
      className={`relative w-full h-full ${className ?? ""}`}
    >
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

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
