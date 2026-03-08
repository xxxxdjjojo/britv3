"use client";

/**
 * Client-side hooks for geocoding UK postcodes.
 * Uses @tanstack/react-query for caching and use-debounce for autocomplete.
 */

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import type { GeocodedLocation } from "@/types/search";

const GEOCODE_STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook to geocode a UK postcode to lat/lng.
 * Results are cached for 24 hours (postcodes don't change).
 */
export function useGeocode(postcode: string | null) {
  return useQuery<GeocodedLocation | null>({
    queryKey: ["geocode", "lookup", postcode],
    queryFn: async () => {
      if (!postcode) return null;

      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(postcode)}&type=lookup`,
      );

      if (!response.ok) {
        throw new Error(`Geocode failed: ${response.status}`);
      }

      const json = await response.json();
      return json.data;
    },
    enabled: !!postcode && postcode.trim().length >= 2,
    staleTime: GEOCODE_STALE_TIME,
  });
}

/**
 * Hook for postcode autocomplete with 300ms debounce.
 * Returns an array of matching postcodes as user types.
 */
export function usePostcodeAutocomplete(partial: string | null) {
  const [debouncedPartial] = useDebounce(partial ?? "", 300);

  return useQuery<string[]>({
    queryKey: ["geocode", "autocomplete", debouncedPartial],
    queryFn: async () => {
      if (!debouncedPartial) return [];

      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(debouncedPartial)}&type=autocomplete`,
      );

      if (!response.ok) {
        throw new Error(`Autocomplete failed: ${response.status}`);
      }

      const json = await response.json();
      return json.data ?? [];
    },
    enabled: debouncedPartial.length >= 2,
    staleTime: GEOCODE_STALE_TIME,
  });
}
