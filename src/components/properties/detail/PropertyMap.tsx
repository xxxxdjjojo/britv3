"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MapInner = dynamic(() => import("./PropertyMapInner"), { ssr: false });

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

type PropertyMapProps = Readonly<{
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
        "relative h-64 rounded-xl overflow-hidden border bg-neutral-100 flex items-center justify-center",
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

export function PropertyMap({
  latitude,
  longitude,
  address,
  className,
}: PropertyMapProps) {
  if (!MAPTILER_KEY) {
    return <MapUnavailable address={address} className={className} />;
  }

  return (
    <MapInner
      latitude={latitude}
      longitude={longitude}
      address={address}
      className={className}
    />
  );
}
