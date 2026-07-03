"use client";

/**
 * Interactive property map using MapLibre GL JS with native clustering.
 * Renders property pins, clusters, and handles user interactions.
 */

import { useCallback, useRef, type ReactNode } from "react";
import { Map, Source, Layer } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapLayerMouseEvent, GeoJSONSource } from "maplibre-gl";
import type { MapRef } from "@vis.gl/react-maplibre";
import type { PropertyMapPoint, MapBounds, MapViewState } from "@/types/map";
import { propertiesToGeoJSON, CLUSTER_MAX_ZOOM, CLUSTER_RADIUS } from "@/lib/map/cluster";

const DEFAULT_VIEW_STATE: Partial<MapViewState> = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 10,
};

const MAPTILER_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? ""}`;

/** TrueDeed green */
const BRAND_GREEN = "#1B4D3E";

type PropertyMapProps = Readonly<{
  properties: PropertyMapPoint[];
  onPropertyClick?: (id: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  initialViewState?: Partial<MapViewState>;
  children?: ReactNode;
  cooperativeGestures?: boolean;
}>;

export function PropertyMap({
  properties,
  onPropertyClick,
  onBoundsChange,
  initialViewState,
  children,
  cooperativeGestures = true,
}: PropertyMapProps) {
  const mapRef = useRef<MapRef>(null);
  const geojson = propertiesToGeoJSON(properties);

  const handleClusterClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const feature = e.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;

      const clusterId = feature.properties?.cluster_id;
      const source = map.getSource("properties") as GeoJSONSource | undefined;
      if (!source || clusterId == null) return;

      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const coords = feature.geometry.type === "Point" ? feature.geometry.coordinates : null;
        if (!coords) return;
        map.flyTo({
          center: [coords[0], coords[1]],
          zoom,
        });
      });
    },
    [],
  );

  const handlePointClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id;
      if (id && onPropertyClick) {
        onPropertyClick(String(id));
      }
    },
    [onPropertyClick],
  );

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;

    const b = map.getBounds();
    if (!b) return;

    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, [onBoundsChange]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ ...DEFAULT_VIEW_STATE, ...initialViewState }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAPTILER_STYLE}
      cooperativeGestures={cooperativeGestures}
      interactiveLayerIds={["clusters", "unclustered-point"]}
      onClick={(e) => {
        const clusterFeature = e.features?.find(
          (f) => f.layer?.id === "clusters",
        );
        if (clusterFeature) {
          handleClusterClick(e);
          return;
        }
        const pointFeature = e.features?.find(
          (f) => f.layer?.id === "unclustered-point",
        );
        if (pointFeature) {
          handlePointClick(e);
        }
      }}
      onMoveEnd={handleMoveEnd}
    >
      <Source
        id="properties"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={CLUSTER_MAX_ZOOM}
        clusterRadius={CLUSTER_RADIUS}
      >
        {/* Cluster circles */}
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": BRAND_GREEN,
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              10, 30,
              50, 40,
            ],
            "circle-opacity": 0.85,
          }}
        />

        {/* Cluster count labels */}
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": "{point_count_abbreviated}",
            "text-size": 13,
          }}
          paint={{
            "text-color": "#ffffff",
          }}
        />

        {/* Unclustered property pins */}
        <Layer
          id="unclustered-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": BRAND_GREEN,
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>

      {children}
    </Map>
  );
}
