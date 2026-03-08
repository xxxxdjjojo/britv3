"use client";

/**
 * Client-side hooks for property search with URL state and data fetching.
 * Uses nuqs for URL search params and @tanstack/react-query for data.
 */

import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean, parseAsArrayOf } from "nuqs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import type { SearchResult, SearchSort } from "@/types/search";
import type { EpcRating, PropertyType } from "@/types/property";

/**
 * URL search parameter parsers for nuqs.
 */
const searchParamsParsers = {
  listing_type: parseAsString,
  min_price: parseAsInteger,
  max_price: parseAsInteger,
  min_bedrooms: parseAsInteger,
  max_bedrooms: parseAsInteger,
  min_bathrooms: parseAsInteger,
  property_type: parseAsArrayOf(parseAsString, ","),
  epc_rating: parseAsString,
  new_build: parseAsBoolean,
  q: parseAsString,
  lat: parseAsString,
  lng: parseAsString,
  radius: parseAsInteger,
  postcode: parseAsString,
  sort: parseAsString,
  per_page: parseAsInteger,
};

/**
 * Hook for managing search parameters in URL state.
 * All filter/sort values are synced with the URL search params.
 */
export function useSearchParams() {
  return useQueryStates(searchParamsParsers, {
    history: "push",
  });
}

/**
 * Build the /api/search URL from active search params.
 */
function buildSearchUrl(
  params: Record<string, string | number | boolean | string[] | null | undefined>,
  cursor?: string,
): string {
  const url = new URL("/api/search", window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value) && value.length > 0) {
      url.searchParams.set(key, value.join(","));
    } else if (typeof value === "boolean") {
      url.searchParams.set(key, String(value));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  return url.toString();
}

/**
 * Hook for fetching search results with infinite scroll support.
 * Debounces parameter changes by 300ms.
 */
export function useSearchResults(params: {
  listing_type?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_bedrooms?: number | null;
  max_bedrooms?: number | null;
  min_bathrooms?: number | null;
  property_type?: (string | null)[] | null;
  epc_rating?: string | null;
  new_build?: boolean | null;
  q?: string | null;
  lat?: string | null;
  lng?: string | null;
  radius?: number | null;
  postcode?: string | null;
  sort?: string | null;
  per_page?: number | null;
}) {
  // Clean params: strip nulls
  const cleanParams: Record<string, string | number | boolean | string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      const filtered = value.filter((v): v is string => v != null);
      if (filtered.length > 0) cleanParams[key] = filtered;
    } else {
      cleanParams[key] = value;
    }
  }

  const [debouncedParams] = useDebounce(cleanParams, 300);

  // Build a stable query key from sorted params
  const queryKey = ["search", JSON.stringify(
    Object.entries(debouncedParams ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  )];

  return useInfiniteQuery<SearchResult>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const url = buildSearchUrl(
        debouncedParams ?? {},
        pageParam as string | undefined,
      );
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
  });
}

// Re-export types for convenience
export type { SearchSort, EpcRating, PropertyType };
