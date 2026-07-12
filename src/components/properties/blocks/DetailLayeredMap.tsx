"use client";

import dynamic from "next/dynamic";
import type { NearbyMapListing } from "@/services/properties/nearby-map-listings";

const MapInner = dynamic(() => import("./DetailLayeredMapInner"), { ssr: false });

type DetailLayeredMapProps = Readonly<{
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
  priceFormatted?: string;
  nearbyListings?: readonly NearbyMapListing[];
}>;

/**
 * Block 06 (map) — an interactive, property-centred map with toggleable
 * market-data overlays (area prices, sold prices) reusing the market-map MVT
 * tiles. Uses the self-hosted OpenFreeMap style; no API key required.
 */
export function DetailLayeredMap(props: DetailLayeredMapProps) {
  return <MapInner {...props} />;
}
