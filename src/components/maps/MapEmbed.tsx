"use client";

import { Map, Marker } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type MapEmbedProps = Readonly<{
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
  grayscale?: boolean;
}>;

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";

export function MapEmbed({
  latitude = 51.4754,
  longitude = -0.3368,
  zoom = 13,
  className,
  grayscale = false,
}: MapEmbedProps) {
  const mapStyle = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;

  return (
    <div
      className={className}
      style={grayscale ? { filter: "grayscale(100%) opacity(0.8)" } : undefined}
    >
      <Map
        initialViewState={{ latitude, longitude, zoom }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        cooperativeGestures
      >
        <Marker latitude={latitude} longitude={longitude} />
      </Map>
    </div>
  );
}
