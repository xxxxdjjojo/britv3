"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MapInner = dynamic(() => import("./DetailLayeredMapInner"), { ssr: false });

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

type DetailLayeredMapProps = Readonly<{
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
}>;

function MapUnavailable({
  address,
  className,
}: Readonly<{ address: string; className?: string }>) {
  return (
    <div
      className={cn(
        "relative h-72 rounded-xl overflow-hidden border bg-neutral-100 flex items-center justify-center",
        className,
      )}
    >
      <div className="text-center text-muted-foreground">
        <MapPin className="size-10 opacity-40 mx-auto mb-2" />
        <p className="text-sm">Map unavailable</p>
        <p className="text-xs mt-1">{address}</p>
      </div>
    </div>
  );
}

/**
 * Block 06 (map) — an interactive, property-centred map with toggleable
 * market-data overlays (area prices, sold prices) reusing the market-map MVT
 * tiles. Falls back to a static panel when no MapTiler key is configured.
 */
export function DetailLayeredMap(props: DetailLayeredMapProps) {
  if (!MAPTILER_KEY) {
    return <MapUnavailable address={props.address} className={props.className} />;
  }
  return <MapInner {...props} />;
}
