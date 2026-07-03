"use client";
// This file is dynamically imported (no SSR)

import { useState } from "react";
import { Map, Marker } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const MAPTILER_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

type AmenityLayer = "schools" | "transport" | "shops";

const AMENITY_LABELS: Record<AmenityLayer, string> = {
  schools: "Schools",
  transport: "Transport",
  shops: "Shops",
};

const ALL_AMENITIES = Object.keys(AMENITY_LABELS) as AmenityLayer[];

type PropertyMapInnerProps = Readonly<{
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
}>;

export default function PropertyMapInner({
  latitude,
  longitude,
  address,
  className,
}: PropertyMapInnerProps) {
  const [activeAmenities, setActiveAmenities] = useState<Set<AmenityLayer>>(
    new Set(),
  );

  function toggleAmenity(layer: AmenityLayer) {
    setActiveAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Map container */}
      <div className="relative h-64 rounded-xl overflow-hidden border">
        <Map
          initialViewState={{ latitude, longitude, zoom: 14 }}
          mapStyle={MAPTILER_STYLE}
          style={{ width: "100%", height: "100%" }}
          cooperativeGestures
        >
          {/* Property pin marker */}
          <Marker latitude={latitude} longitude={longitude}>
            <div
              className="flex items-center justify-center size-7 rounded-full bg-[#1B4D3E] border-2 border-white shadow-md"
              aria-label={address}
              title={address}
            >
              <span className="text-white text-xs leading-none">&#9679;</span>
            </div>
          </Marker>
        </Map>
      </div>

      {/* Amenity toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {ALL_AMENITIES.map((layer) => {
          const isActive = activeAmenities.has(layer);
          return (
            <Button
              key={layer}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => toggleAmenity(layer)}
              className={cn(
                "text-xs h-7 px-3 rounded-full",
                isActive
                  ? "bg-[#1B4D3E]/10 text-[#1B4D3E] border border-[#1B4D3E]/30"
                  : "border text-muted-foreground hover:bg-muted",
              )}
            >
              {AMENITY_LABELS[layer]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
