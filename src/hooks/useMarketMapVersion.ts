"use client";

/**
 * Fetches the market-map data-version token (GET /api/market-map/version).
 *
 * The version is appended to vector-tile URLs as `?v=<version>` so a precompute
 * rebuild yields fresh, immutable-cacheable URLs. Falls back to "0" until the
 * fetch resolves (or if it fails) so tiles still load with a stable key.
 */

import { useQuery } from "@tanstack/react-query";

const FALLBACK_VERSION = "0";

export function useMarketMapVersion(): string {
  const { data } = useQuery({
    queryKey: ["market-map-version"],
    queryFn: async (): Promise<string> => {
      const response = await fetch("/api/market-map/version");
      if (!response.ok) {
        throw new Error(`market-map version fetch failed: ${response.status}`);
      }
      const json = (await response.json()) as { version: string };
      return json.version;
    },
    // The version changes only when the precompute rebuilds — keep it cached.
    staleTime: 5 * 60_000,
  });

  return data ?? FALLBACK_VERSION;
}
