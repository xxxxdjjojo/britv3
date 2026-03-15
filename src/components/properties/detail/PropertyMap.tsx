"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MapInner = dynamic(() => import("./PropertyMapInner"), { ssr: false });

type PropertyMapProps = Readonly<{
  lat: number | null;
  lng: number | null;
  address: string;
  className?: string;
}>;

export function PropertyMap({ lat, lng, address, className }: PropertyMapProps) {
  if (!lat || !lng) {
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

  return <MapInner lat={lat} lng={lng} address={address} className={className} />;
}
