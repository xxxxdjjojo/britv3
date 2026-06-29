"use client";
// Dynamically imported (no SSR) — MapLibre needs `window`.

import { useState } from "react";
import { Map as MapGL, Source, Layer, Marker, NavigationControl } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { colourForBucket, INSUFFICIENT_COLOUR } from "@/lib/market-map/colour";
import { colourForSoldBucket, SOLD_INSUFFICIENT_COLOUR } from "@/lib/market-map/sold-colour";
import { useMarketMapVersion } from "@/hooks/useMarketMapVersion";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const MAPTILER_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

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
}>;

export default function DetailLayeredMapInner({
  latitude,
  longitude,
  address,
  className,
}: DetailLayeredMapInnerProps) {
  const dataVersion = useMarketMapVersion();
  const [showArea, setShowArea] = useState(true);
  const [showSold, setShowSold] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const areaTiles = `${origin}/api/market-map/tiles/{z}/{x}/{y}?v=${dataVersion}`;
  const soldTiles = `${origin}/api/market-map/sold/{z}/{x}/{y}?v=${dataVersion}`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative h-72 rounded-xl overflow-hidden border">
        <MapGL
          initialViewState={{ latitude, longitude, zoom: 13 }}
          mapStyle={MAPTILER_STYLE}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {showArea && (
            <Source id={AREA_SOURCE} type="vector" tiles={[areaTiles]} minzoom={4} maxzoom={14}>
              <Layer
                id={`${AREA_SOURCE}-fill`}
                type="fill"
                source={AREA_SOURCE}
                source-layer={AREA_LAYER}
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
                paint={{
                  "fill-color": SOLD_FILL_COLOUR as unknown as string,
                  "fill-opacity": 0.7,
                }}
              />
            </Source>
          )}

          <Marker latitude={latitude} longitude={longitude}>
            <div
              className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#1B4D3E] shadow-md"
              aria-label={address}
              title={address}
            >
              <span className="text-xs leading-none text-white">&#9679;</span>
            </div>
          </Marker>
        </MapGL>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Map layers:</span>
        <LayerChip label="Area prices" active={showArea} onClick={() => setShowArea((v) => !v)} />
        <LayerChip label="Sold prices" active={showSold} onClick={() => setShowSold((v) => !v)} />
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
