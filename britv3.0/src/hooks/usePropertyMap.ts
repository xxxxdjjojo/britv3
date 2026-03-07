"use client";

/**
 * Hook for managing map state: viewport, bounds, selected property.
 */

import { useCallback, useState } from "react";
import type { MapBounds, MapViewState } from "@/types/map";

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

export function usePropertyMap(initial?: Partial<MapViewState>) {
  const [viewState, setViewState] = useState<MapViewState>({
    ...DEFAULT_VIEW_STATE,
    ...initial,
  });
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const onBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const flyTo = useCallback((lat: number, lng: number, zoom?: number) => {
    setViewState((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: zoom ?? prev.zoom,
    }));
  }, []);

  const fitBounds = useCallback((newBounds: MapBounds, _padding?: number) => {
    // Set bounds for the map; the actual fitting is done by the Map component
    setBounds(newBounds);
    // Approximate center from bounds
    setViewState((prev) => ({
      ...prev,
      latitude: (newBounds.north + newBounds.south) / 2,
      longitude: (newBounds.east + newBounds.west) / 2,
    }));
  }, []);

  return {
    viewState,
    setViewState,
    bounds,
    onBoundsChange,
    selectedPropertyId,
    setSelectedPropertyId,
    flyTo,
    fitBounds,
  };
}
