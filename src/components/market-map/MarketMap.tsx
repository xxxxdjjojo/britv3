"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatCompactPounds } from "@/lib/market-map/format";
import { INSUFFICIENT_COLOUR } from "@/lib/market-map/constants";
import type { MarketMapFeatureCollection } from "@/types/market-map";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const STREETS_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const SOURCE_ID = "market-areas";
const FILL_LAYER = "market-areas-fill";
const LINE_LAYER = "market-areas-line";

type Props = Readonly<{
  data: MarketMapFeatureCollection;
  selectedAreaId: string | null;
  onSelectArea: (areaId: string | null) => void;
  onHoverArea: (areaId: string | null) => void;
  className?: string;
}>;

type BBox = [number, number, number, number];

function extendBBox(bbox: BBox, lng: number, lat: number): void {
  bbox[0] = Math.min(bbox[0], lng);
  bbox[1] = Math.min(bbox[1], lat);
  bbox[2] = Math.max(bbox[2], lng);
  bbox[3] = Math.max(bbox[3], lat);
}

function walkCoords(coords: unknown, fn: (lng: number, lat: number) => void): void {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    fn(coords[0], coords[1]);
    return;
  }
  for (const c of coords) walkCoords(c, fn);
}

function featureCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  let sx = 0;
  let sy = 0;
  let n = 0;
  walkCoords((geometry as { coordinates?: unknown }).coordinates, (lng, lat) => {
    sx += lng;
    sy += lat;
    n += 1;
  });
  return n > 0 ? [sx / n, sy / n] : null;
}

function collectionBBox(data: MarketMapFeatureCollection): BBox | null {
  const bbox: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  let any = false;
  for (const f of data.features) {
    walkCoords((f.geometry as { coordinates?: unknown }).coordinates, (lng, lat) => {
      extendBBox(bbox, lng, lat);
      any = true;
    });
  }
  return any ? bbox : null;
}

/**
 * Choropleth map of median sold price by postcode district. Renders a GeoJSON
 * fill layer coloured by the API's `fill_colour`, an outline, and floating
 * price-pill markers at each district centroid. Emits hover/click of areas.
 */
function MarketMap({
  data,
  selectedAreaId,
  onSelectArea,
  onHoverArea,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const didFitRef = useRef(false);

  const onSelectRef = useRef(onSelectArea);
  onSelectRef.current = onSelectArea;
  const onHoverRef = useRef(onHoverArea);
  onHoverRef.current = onHoverArea;

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPTILER_KEY) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREETS_STYLE,
      center: [-0.19, 51.46],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      loadedRef.current = true;
      syncData();
    });

    mapRef.current = map;
    return () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      didFitRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync whenever data or selection changes.
  useEffect(() => {
    syncData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedAreaId]);

  function syncData(): void {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const fc = data as unknown as GeoJSON.FeatureCollection;

    const existing = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(fc);
    } else {
      map.addSource(SOURCE_ID, { type: "geojson", data: fc, promoteId: "area_id" });
      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": ["coalesce", ["get", "fill_colour"], INSUFFICIENT_COLOUR],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.85,
            0.6,
          ],
        },
      });
      map.addLayer({
        id: LINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#1B4D3E",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            ["boolean", ["feature-state", "hover"], false],
            2,
            0.8,
          ],
          "line-opacity": 0.65,
        },
      });
      wireInteractions(map);
    }

    // Selected feature-state.
    for (const f of data.features) {
      map.setFeatureState(
        { source: SOURCE_ID, id: f.properties.area_id },
        { selected: f.properties.area_id === selectedAreaId },
      );
    }

    rebuildMarkers(map);

    if (!didFitRef.current) {
      const bbox = collectionBBox(data);
      if (bbox && Number.isFinite(bbox[0])) {
        // Ensure the map knows its real container size before fitting — on
        // mobile the container can still be settling when data first arrives.
        map.resize();
        map.fitBounds(bbox, { padding: 40, duration: 0 });
        didFitRef.current = true;
      }
    }
  }

  function wireInteractions(map: maplibregl.Map): void {
    map.on("mousemove", FILL_LAYER, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      map.getCanvas().style.cursor = "pointer";
      const id = String(feature.properties?.area_id ?? "");
      if (hoveredRef.current && hoveredRef.current !== id) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredRef.current }, { hover: false });
      }
      hoveredRef.current = id;
      map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
      onHoverRef.current(id);
    });
    map.on("mouseleave", FILL_LAYER, () => {
      map.getCanvas().style.cursor = "";
      if (hoveredRef.current) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredRef.current }, { hover: false });
      }
      hoveredRef.current = null;
      onHoverRef.current(null);
    });
    map.on("click", FILL_LAYER, (e) => {
      const id = String(e.features?.[0]?.properties?.area_id ?? "");
      onSelectRef.current(id || null);
    });
  }

  function rebuildMarkers(map: maplibregl.Map): void {
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    for (const f of data.features) {
      const centroid = featureCentroid(f.geometry);
      if (!centroid) continue;
      const props = f.properties;
      const isSelected = props.area_id === selectedAreaId;
      const insufficient = props.confidence === "Insufficient";

      const el = document.createElement("button");
      el.type = "button";
      el.className = "market-pill";
      el.style.cssText = [
        "display:flex",
        "flex-direction:column",
        "align-items:center",
        "gap:1px",
        "padding:3px 8px",
        "border-radius:9999px",
        "border:none",
        "cursor:pointer",
        `background:${isSelected ? "#1B4D3E" : "rgba(255,255,255,0.95)"}`,
        `color:${isSelected ? "#ffffff" : "#1a1c1c"}`,
        "font-family:var(--font-sans, Inter, sans-serif)",
        "font-weight:600",
        "font-size:11px",
        "line-height:1.1",
        "box-shadow:0 2px 8px rgba(26,28,28,0.18)",
        `opacity:${insufficient ? "0.7" : "1"}`,
      ].join(";");
      const primary = document.createElement("span");
      const secondary = document.createElement("span");
      if (insufficient) {
        primary.style.fontSize = "10px";
        primary.textContent = props.area_id;
        secondary.style.cssText = "font-size:9px;opacity:0.8";
        secondary.textContent = "n/a";
      } else {
        primary.textContent = formatCompactPounds(props.median_price);
        secondary.style.cssText = "font-size:9px;opacity:0.7";
        secondary.textContent = props.area_id;
      }
      el.append(primary, secondary);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelectRef.current(isSelected ? null : props.area_id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(centroid)
        .addTo(map);
      markersRef.current.push(marker);
    }
  }

  if (!MAPTILER_KEY) {
    return (
      <div className={`flex h-full items-center justify-center rounded-lg bg-muted ${className ?? ""}`}>
        <p className="text-sm text-muted-foreground">
          Map unavailable — MapTiler API key not configured.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export default MarketMap;
