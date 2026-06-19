"use client";

/**
 * TanStack Query hook for the instant area card (flat/house price bands) from
 * GET /api/market-map/card.
 *
 * Fetched lazily — only when an area is selected (areaId present). Keyed by
 * level + areaId + window so changing the selection or window refetches;
 * cached results are reused otherwise.
 */

import { useQuery } from "@tanstack/react-query";
import type { MarketAreaCard } from "@/services/market-map/area-detail-service";

export type UseMarketAreaCardResult = {
  card: MarketAreaCard | null;
  isLoading: boolean;
};

export function useMarketAreaCard(
  level: string,
  areaId: string,
  windowMonths = 12,
): UseMarketAreaCardResult {
  const enabled = Boolean(areaId);

  const { data, isLoading } = useQuery<MarketAreaCard>({
    queryKey: ["market-area-card", level, areaId, windowMonths] as const,
    queryFn: async () => {
      const url = new URL("/api/market-map/card", window.location.origin);
      url.searchParams.set("level", level);
      url.searchParams.set("area_id", areaId);
      url.searchParams.set("window", String(windowMonths));
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`market-area-card fetch failed: ${response.status}`);
      }
      return response.json() as Promise<MarketAreaCard>;
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    card: data ?? null,
    isLoading: enabled && isLoading,
  };
}
