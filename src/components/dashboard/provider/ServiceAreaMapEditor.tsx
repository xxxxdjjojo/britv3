/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Trash2, CircleDot, Pentagon, MousePointer } from "lucide-react";
import type { ProviderServiceArea } from "@/types/provider-dashboard";

// Dynamically imported — MapLibre requires a browser environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MaplibreMapInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TerraDrawInstance = any;

type DrawMode = "polygon" | "circle" | "select" | null;

type ZoneFeature = {
  id: string;
  name: string | null;
  zone_type: "radius" | "polygon";
  geometry: GeoJSON.Geometry;
};

type ServiceAreaMapEditorProps = Readonly<{
  initialAreas: ProviderServiceArea[];
}>;

const MAP_CENTER: [number, number] = [-0.1278, 51.5074]; // [lng, lat] for MapLibre
const MAP_ZOOM = 8;
const ZONE_FILL_COLOR = "rgba(27,77,62,0.15)";
const ZONE_STROKE_COLOR = "#1B4D3E";

export function ServiceAreaMapEditor({
  initialAreas,
}: ServiceAreaMapEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMapInstance>(null);
  const terraRef = useRef<TerraDrawInstance>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [zones, setZones] = useState<ZoneFeature[]>(
    initialAreas.map((a) => ({
      id: a.id,
      name: a.name,
      zone_type: a.zone_type,
      geometry: a.zone as GeoJSON.Geometry,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingFeatureId, setPendingFeatureId] = useState<string | null>(null);

  // Render existing zones onto the map
  const renderZones = useCallback(
    (map: MaplibreMapInstance, currentZones: ZoneFeature[]) => {
      // Remove existing layers/sources
      if (map.getLayer("zones-fill")) map.removeLayer("zones-fill");
      if (map.getLayer("zones-line")) map.removeLayer("zones-line");
      if (map.getSource("zones")) map.removeSource("zones");

      if (currentZones.length === 0) return;

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: currentZones.map((z) => ({
          type: "Feature",
          id: z.id,
          properties: { name: z.name, zone_type: z.zone_type },
          geometry: z.geometry,
        })),
      };

      map.addSource("zones", { type: "geojson", data: geojson });

      map.addLayer({
        id: "zones-fill",
        type: "fill",
        source: "zones",
        paint: {
          "fill-color": ZONE_FILL_COLOR,
        },
      });

      map.addLayer({
        id: "zones-line",
        type: "line",
        source: "zones",
        paint: {
          "line-color": ZONE_STROKE_COLOR,
          "line-width": 2,
        },
      });
    },
    [],
  );

  // Initialise map + terra-draw on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: MaplibreMapInstance;
    let draw: TerraDrawInstance;
    let cancelled = false;

    async function init() {
      const [{ Map }, { TerraDraw, TerraDrawPolygonMode, TerraDrawCircleMode, TerraDrawSelectMode }, { TerraDrawMapLibreGLAdapter }] =
        await Promise.all([
          import("maplibre-gl"),
          import("terra-draw"),
          import("terra-draw-maplibre-gl-adapter"),
        ]);

      if (cancelled) return;

      map = new Map({
        container: mapContainerRef.current!,
        style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? ""}`,
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
      });

      map.on("load", () => {
        if (cancelled) return;

        mapRef.current = map;

        // Render existing zones
        renderZones(map, zones);

        // Initialise terra-draw
        draw = new TerraDraw({
          adapter: new TerraDrawMapLibreGLAdapter({ map }),
          modes: [
            new TerraDrawPolygonMode(),
            new TerraDrawCircleMode(),
            new TerraDrawSelectMode({
              flags: {
                polygon: { feature: { draggable: true } },
                circle: { feature: { draggable: true } },
              },
            }),
          ],
        });

        draw.start();
        terraRef.current = draw;

        // Listen for finished drawings
        draw.on("finish", (id: string) => {
          if (cancelled) return;
          setPendingFeatureId(id);
        });

        setIsLoading(false);
      });
    }

    init().catch((err) => {
      console.error("Map init error:", err);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      if (draw) {
        try {
          draw.stop();
        } catch {
          // ignore
        }
      }
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      terraRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render zones whenever `zones` state changes (but after initial map load)
  useEffect(() => {
    if (mapRef.current && !isLoading) {
      renderZones(mapRef.current, zones);
    }
  }, [zones, isLoading, renderZones]);

  function activateMode(mode: DrawMode) {
    const draw = terraRef.current;
    if (!draw) return;
    setDrawMode(mode);
    setPendingFeatureId(null);
    if (mode === "polygon") draw.setMode("polygon");
    else if (mode === "circle") draw.setMode("circle");
    else if (mode === "select") draw.setMode("select");
    else draw.setMode("static");
  }

  async function savePendingFeature() {
    if (!pendingFeatureId || !terraRef.current) return;

    const draw = terraRef.current;

    // Get the snapshot of all features
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot: GeoJSON.Feature[] = draw.getSnapshot() as GeoJSON.Feature[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feature = snapshot.find((f: any) => f.id === pendingFeatureId);
    if (!feature) {
      setSaveError("Could not find drawn feature.");
      return;
    }

    const zone_type: "radius" | "polygon" =
      // terra-draw circle mode uses a polygon geometry but stores mode in properties
      (feature.properties?.mode === "circle" ||
        feature.geometry.type === "Point")
        ? "radius"
        : "polygon";

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/provider/service-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: feature.geometry,
          zone_type,
          is_primary: zones.length === 0,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setSaveError(body.error ?? "Failed to save zone.");
        return;
      }

      const saved = (await res.json()) as ProviderServiceArea;

      // Remove the terra-draw feature (it's now stored server-side)
      draw.removeFeatures([pendingFeatureId]);
      setPendingFeatureId(null);
      setDrawMode(null);
      draw.setMode("static");

      setZones((prev) => [
        ...prev,
        {
          id: saved.id,
          name: saved.name,
          zone_type: saved.zone_type,
          geometry: saved.zone as GeoJSON.Geometry,
        },
      ]);
    } finally {
      setSaving(false);
    }
  }

  function discardPending() {
    const draw = terraRef.current;
    if (!draw || !pendingFeatureId) return;
    draw.removeFeatures([pendingFeatureId]);
    setPendingFeatureId(null);
    setDrawMode(null);
    draw.setMode("static");
  }

  async function deleteZone(zoneId: string) {
    if (!confirm("Delete this service area zone?")) return;

    const res = await fetch(
      `/api/provider/service-areas?id=${encodeURIComponent(zoneId)}`,
      { method: "DELETE" },
    );
    if (!res.ok && res.status !== 204) {
      alert("Failed to delete zone.");
      return;
    }
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => activateMode("polygon")}
          className={[
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            drawMode === "polygon"
              ? "border-[#1B4D3E] bg-[#E8F5EE] text-[#1B4D3E]"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-400",
          ].join(" ")}
        >
          <Pentagon className="size-4" />
          Draw Area
        </button>
        <button
          type="button"
          onClick={() => activateMode("circle")}
          className={[
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            drawMode === "circle"
              ? "border-[#1B4D3E] bg-[#E8F5EE] text-[#1B4D3E]"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-400",
          ].join(" ")}
        >
          <CircleDot className="size-4" />
          Draw Radius
        </button>
        <button
          type="button"
          onClick={() => activateMode("select")}
          className={[
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            drawMode === "select"
              ? "border-[#1B4D3E] bg-[#E8F5EE] text-[#1B4D3E]"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-400",
          ].join(" ")}
        >
          <MousePointer className="size-4" />
          Select
        </button>

        {/* Pending feature actions */}
        {pendingFeatureId && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-neutral-600">Zone drawn.</span>
            <button
              type="button"
              onClick={discardPending}
              disabled={saving}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={savePendingFeature}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#1B4D3E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#163d31] disabled:opacity-50"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save Zone
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}

      {/* Map container */}
      <div className="relative h-[500px] overflow-hidden rounded-xl border border-neutral-200">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-50">
            <Loader2 className="size-8 animate-spin text-[#1B4D3E]" />
          </div>
        )}
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Saved zones list */}
      {zones.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">
            Saved Zones ({zones.length})
          </h3>
          <ul className="space-y-2">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#1B4D3E]" />
                  <span className="text-sm text-neutral-700">
                    {zone.name ?? (zone.zone_type === "radius" ? "Radius zone" : "Polygon zone")}
                  </span>
                  <span className="rounded-full bg-[#E8F5EE] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1B4D3E]">
                    {zone.zone_type}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Delete zone"
                  onClick={() => deleteZone(zone.id)}
                  className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {zones.length === 0 && !isLoading && (
        <p className="text-center text-sm text-neutral-500">
          Draw your first service area zone on the map above.
        </p>
      )}
    </div>
  );
}
