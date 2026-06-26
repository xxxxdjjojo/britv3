"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ListingVolume as ListingVolumeComponent } from "@/components/charts/ListingVolume";

const ListingVolume = dynamic(
  () => import("@/components/charts/ListingVolume").then((m) => ({ default: m.ListingVolume })),
  { ssr: false, loading: () => <div className="h-[180px] animate-pulse bg-primary/5 rounded-xl" /> }
);

type Props = ComponentProps<typeof ListingVolumeComponent>;

export function ListingVolumeClient(props: Props) {
  return <ListingVolume {...props} />;
}
