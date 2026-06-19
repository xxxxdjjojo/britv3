"use client";

/**
 * TanStack Query hook for fetching area search results from
 * GET /api/market-search?q=<query>.
 *
 * Debounces the query string by 250 ms and skips the fetch when the
 * query is fewer than 2 characters.
 */

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import type { MarketSearchResultDTO } from "@/services/market-map/search-service";

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

type MarketSearchResponse = {
  results: MarketSearchResultDTO[];
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type UseMarketSearchResult = {
  results: MarketSearchResultDTO[];
  isLoading: boolean;
};

/**
 * Fetches area suggestions matching the given query string.
 *
 * - Debounced 250 ms so keystroke bursts produce a single request.
 * - Skips the fetch entirely when the query is fewer than 2 characters.
 * - Returns an empty results array while loading or when the query is short.
 */
export function useMarketSearch(query: string): UseMarketSearchResult {
  const [debouncedQuery] = useDebounce(query.trim(), 250);

  const enabled = debouncedQuery.length >= 2;

  const { data, isLoading } = useQuery<MarketSearchResponse>({
    queryKey: ["market-search", debouncedQuery] as const,
    queryFn: async () => {
      const url = new URL("/api/market-search", window.location.origin);
      url.searchParams.set("q", debouncedQuery);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`market-search fetch failed: ${response.status}`);
      }
      return response.json() as Promise<MarketSearchResponse>;
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    results: data?.results ?? [],
    isLoading: enabled && isLoading,
  };
}
