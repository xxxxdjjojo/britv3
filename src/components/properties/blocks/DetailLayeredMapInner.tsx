"use client";
// Dynamically imported (no SSR) — MapLibre needs `window`.

import { useState, useRef } from "react";
import { Map as MapGL, Source, Layer, Marker, NavigationControl } from "@vis.gl/react-maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { colourForBucket, INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
import { colourForSoldBucket, SOLD_INSUFFICIENT_COLOUR } from "@/lib/market-map/sold-colour";
import { useMarketMapVersion } from "@/hooks/useMarketMapVersion";
import { circlePolygon } from "@/lib/map/circle-polygon";

const MAP_STYLE_URL = "/map/truedeed-style.json";

const AREA_SOURCE = "detail-areas";
const AREA_LAYER = "areas";
const SOLD_SOURCE = "detail-sold";
const SOLD_LAYER = "sold_parcels";
const SOLD_MINZOOM = 14;

// Reuse the market-map colour ramps so the detail map matches the explorer.
const AREA_FILL_COLOUR = [
  "match", ["get", "bucket"],
  1, colourForBucket(1), 2, colourForBucket(2), 3, colourForBucket(3),
  4, colourForBucket(4), 5, colourForBucket(5), 6, colourForBucket(6),
  7, colourForBucket(7), 8, colourForBucket(8), 9, colourForBucket(9),
  INSUFFICIENT_COLOUR,
];

const SOLD_FILL_COLOUR = [
  "match", ["get", "bucket"],
  1, colourForSoldBucket(1), 2, colourForSoldBucket(2), 3, colourForSoldBucket(3),
  4, colourForSoldBucket(4), 5, colourForSoldBucket(5), 6, colourForSoldBucket(6),
  7, colourForSoldBucket(7), 8, colourForSoldBucket(8), 9, colourForSoldBucket(9),
  SOLD_INSUFFICIENT_COLOUR,
];

type DetailLayeredMapInnerProps = Readonly<{
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
  priceFormatted?: string;
}>;

export default function DetailLayeredMapInner({
  latitude,
  longitude,
  address,
  className,
  priceFormatted,
}: DetailLayeredMapInnerProps) {
  const dataVersion = useMarketMapVersion();
  const [showArea, setShowArea] = useState(true);
  const [showSold, setShowSold] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const areaTiles = `${origin}/api/market-map/tiles/{z}/{x}/{y}?v=${dataVersion}`;
  const soldTiles = `${origin}/api/market-map/sold/{z}/{x}/{y}?v=${dataVersion}`;

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.easeTo({ pitch: next ? 58 : 0, duration: 500 });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative h-72 rounded-xl overflow-hidden border">
        <MapGL
          initialViewState={{ latitude, longitude, zoom: 16, pitch: 58, bearing: -18 }}
          mapStyle={MAP_STYLE_URL}
          style={{ width: "100%", height: "100%" }}
          cooperativeGestures
          ref={(ref) => { mapRef.current = (ref && typeof ref === "object" && "getMap" in ref) ? (ref as { getMap: () => maplibregl.Map }).getMap() : null; }}
        >
          <NavigationControl position="top-right" visualizePitch={true} showCompass={true} />

          <Source
            id="td-zone"
            type="geojson"
            data={circlePolygon(longitude, latitude, 250)}
          >
            <Layer
              id="td-zone-fill"
              type="fill"
              source="td-zone"
              beforeId="td-buildings-3d"
              paint={{ "fill-color": "#2D7A5F", "fill-opacity": 0.24 }}
            />
            <Layer
              id="td-zone-line"
              type="line"
              source="td-zone"
              beforeId="td-buildings-3d"
              paint={{ "line-color": "#2D7A5F", "line-opacity": 0.55, "line-width": 1.5 }}
            />
          </Source>

          {showArea && (
            <Source id={AREA_SOURCE} type="vector" tiles={[areaTiles]} minzoom={4} maxzoom={14}>
              <Layer
                id={`${AREA_SOURCE}-fill`}
                type="fill"
                source={AREA_SOURCE}
                source-layer={AREA_LAYER}
                beforeId="td-buildings-3d"
                paint={{
                  "fill-color": AREA_FILL_COLOUR as unknown as string,
                  "fill-opacity": 0.55,
                }}
              />
              <Layer
                id={`${AREA_SOURCE}-stroke`}
                type="line"
                source={AREA_SOURCE}
                source-layer={AREA_LAYER}
                beforeId="td-buildings-3d"
                paint={{ "line-color": "rgba(255,255,255,0.4)", "line-width": 0.5 }}
              />
            </Source>
          )}

          {showSold && (
            <Source id={SOLD_SOURCE} type="vector" tiles={[soldTiles]} minzoom={SOLD_MINZOOM} maxzoom={14}>
              <Layer
                id={`${SOLD_SOURCE}-fill`}
                type="fill"
                source={SOLD_SOURCE}
                source-layer={SOLD_LAYER}
                minzoom={SOLD_MINZOOM}
                beforeId="td-buildings-3d"
                paint={{
                  "fill-color": SOLD_FILL_COLOUR as unknown as string,
                  "fill-opacity": 0.7,
                }}
              />
            </Source>
          )}

          <Marker latitude={latitude} longitude={longitude} anchor="bottom">
            <div className="relative flex flex-col items-center">
              <div
                className="rounded-[var(--radius-md)] bg-[#1B4D3E] px-2.5 py-1 shadow-md"
                aria-label={address}
              >
                <span className="whitespace-nowrap text-xs font-semibold leading-none text-white">
                  {priceFormatted ?? address}
                </span>
              </div>
              {/* CSS pointer triangle */}
              <div
                className="size-0"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "6px solid #1B4D3E",
                }}
              />
            </div>
          </Marker>
        </MapGL>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Map layers:</span>
        <LayerChip label="Area prices" active={showArea} onClick={() => setShowArea((v) => !v)} />
        <LayerChip label="Sold prices" active={showSold} onClick={() => setShowSold((v) => !v)} />
        <LayerChip label="3D" active={is3D} onClick={toggle3D} />
        <span className="text-[11px] text-muted-foreground">
          Zoom in for individual sold prices.
        </span>
      </div>
    </div>
  );
}

function LayerChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-7 rounded-full px-3 text-xs",
        active
          ? "border border-[#1B4D3E]/30 bg-[#1B4D3E]/10 text-[#1B4D3E] hover:bg-[#1B4D3E]/15"
          : "border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </Button>
  );
}
