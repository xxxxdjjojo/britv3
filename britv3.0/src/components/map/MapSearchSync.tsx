"use client";

/**
 * Syncs map viewport with search parameters.
 * When map bounds change, updates search params with visible area.
 * When search location changes, flies map to that location.
 */

import { useEffect, useRef, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { MapBounds } from "@/types/map";

type MapSearchSyncProps = Readonly<{
  /** Current map bounds (from PropertyMap onBoundsChange) */
  bounds: MapBounds | null;
  /** Current search lat/lng (from URL params / geocode) */
  searchLat?: number | null;
  searchLng?: number | null;
  /** Callback to update search params with map bounds */
  onBoundsUpdate?: (bounds: MapBounds) => void;
  /** Callback to fly map to a new location */
  onFlyTo?: (lat: number, lng: number, zoom?: number) => void;
}>;

export function MapSearchSync({
  bounds,
  searchLat,
  searchLng,
  onBoundsUpdate,
  onFlyTo,
}: MapSearchSyncProps) {
  const prevSearchLocation = useRef<{ lat: number; lng: number } | null>(null);

  // Debounce bounds updates by 500ms to avoid excessive re-fetching during panning
  const debouncedBoundsUpdate = useDebouncedCallback(
    (newBounds: MapBounds) => {
      onBoundsUpdate?.(newBounds);
    },
    500,
  );

  // When map bounds change, propagate (debounced) to search
  useEffect(() => {
    if (bounds) {
      debouncedBoundsUpdate(bounds);
    }
  }, [bounds, debouncedBoundsUpdate]);

  // When search location changes (e.g., new postcode geocoded), fly map there
  useEffect(() => {
    if (searchLat == null || searchLng == null) return;

    const prev = prevSearchLocation.current;
    if (prev && prev.lat === searchLat && prev.lng === searchLng) return;

    prevSearchLocation.current = { lat: searchLat, lng: searchLng };
    onFlyTo?.(searchLat, searchLng, 13);
  }, [searchLat, searchLng, onFlyTo]);

  // This component is behavior-only, no UI
  return null;
}
