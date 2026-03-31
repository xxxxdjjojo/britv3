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

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
const UK_CENTER: [number, number] = [-2, 54.5];
const DEFAULT_ZOOM = 6;

// Brand colors from the Invisible Estate design system
const PROPERTY_MARKER_COLOR = "#1B4D3E"; // brand-primary
const PROVIDER_MARKER_COLOR = "#D4A853"; // brand-secondary

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPropertyMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "14px";
  el.style.height = "14px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = PROPERTY_MARKER_COLOR;
  el.style.border = "2.5px solid white";
  el.style.cursor = "pointer";
  el.style.boxShadow = "0 2px 8px rgba(27,77,62,0.35)";
  el.style.transition = "transform 0.15s ease";
  el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.3)"; });
  el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
  return el;
}

function createProviderMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "11px";
  el.style.height = "11px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = PROVIDER_MARKER_COLOR;
  el.style.border = "2px solid white";
  el.style.cursor = "pointer";
  el.style.boxShadow = "0 2px 6px rgba(160,125,46,0.35)";
  el.style.transition = "transform 0.15s ease";
  el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.3)"; });
  el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
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
  const onPropertyClickRef = useRef(onPropertyClick);
  const onProviderClickRef = useRef(onProviderClick);

  // Keep callback refs up-to-date without triggering re-renders or stale closures
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPropertyClickRef.current = onPropertyClick;
    onProviderClickRef.current = onProviderClick;
  }, [onBoundsChange, onPropertyClick, onProviderClick]);

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

    // Add property markers
    for (const p of properties) {
      const el = createPropertyMarkerElement();
      el.title = p.address;
      el.setAttribute("aria-label", `Property: ${p.address}`);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPropertyClickRef.current(p);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Add provider markers
    for (const p of providers) {
      const el = createProviderMarkerElement();
      el.title = p.name;
      el.setAttribute("aria-label", `Provider: ${p.name}`);
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

  // Guard: show fallback if MapTiler API key is not configured
  if (!MAPTILER_KEY) {
    return (
      <div
        className={`flex h-full items-center justify-center rounded-2xl bg-neutral-100 ${className ?? ""}`}
      >
        <div className="text-center p-8">
          <p className="text-sm text-neutral-400 font-sans">
            Map unavailable — MapTiler API key not configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden ${className ?? ""}`}>
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Control buttons — top-right, glassmorphism */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <button
          ref={styleBtnRef}
          type="button"
          onClick={handleStyleToggle}
          className="bg-white/80 backdrop-blur-md text-neutral-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm hover:bg-white transition-colors min-h-[36px]"
          aria-label="Toggle map style"
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={handleFullscreenToggle}
          className="bg-white/80 backdrop-blur-md text-neutral-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm hover:bg-white transition-colors min-h-[36px]"
          aria-label="Toggle fullscreen"
        >
          Fullscreen
        </button>
      </div>

      {/* Map legend — bottom-left */}
      <div className="absolute bottom-10 left-3 z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-xl px-3.5 py-2.5 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-primary shrink-0" />
            <span className="text-xs font-medium text-neutral-600">Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-secondary shrink-0" />
            <span className="text-xs font-medium text-neutral-600">Providers</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchMap;
