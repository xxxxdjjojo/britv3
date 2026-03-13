"use client";

import dynamic from "next/dynamic";

const ListingVolume = dynamic(
  () => import("@/components/charts/ListingVolume").then((m) => ({ default: m.ListingVolume })),
  { ssr: false, loading: () => <div className="h-[180px] animate-pulse bg-primary/5 rounded-xl" /> }
);

export function ListingVolumeClient() {
  return <ListingVolume />;
}
