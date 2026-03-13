"use client";

import dynamic from "next/dynamic";

const MapEmbed = dynamic(
  () => import("@/components/maps/MapEmbed").then((m) => ({ default: m.MapEmbed })),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-primary/5 rounded-2xl" /> }
);

type MapEmbedClientProps = Readonly<{
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
}>;

export function MapEmbedClient({ latitude, longitude, zoom, className }: MapEmbedClientProps) {
  return <MapEmbed latitude={latitude} longitude={longitude} zoom={zoom} className={className} />;
}
