"use client";

/**
 * TanStack Query hook for the selected-area flat/house breakdown from
 * GET /api/market-map/area/[level]/[areaId].
 *
 * Fetched lazily — only when an area is selected (level + areaId present).
 * Keyed by level + areaId + months so changing the date window or the
 * selection refetches; cached results are reused otherwise.
 */

import { useQuery } from "@tanstack/react-query";
import type { AreaPriceDetail } from "@/services/market-map/types";

export type UseMarketAreaDetailResult = {
  detail: AreaPriceDetail | null;
  isLoading: boolean;
};

export function useMarketAreaDetail(
  level: string | null,
  areaId: string | null,
  months: number,
): UseMarketAreaDetailResult {
  const enabled = Boolean(level) && Boolean(areaId);

  const { data, isLoading } = useQuery<AreaPriceDetail>({
    queryKey: ["market-area-detail", level, areaId, months] as const,
    queryFn: async () => {
      const url = new URL(
        `/api/market-map/area/${encodeURIComponent(level as string)}/${encodeURIComponent(areaId as string)}`,
        window.location.origin,
      );
      url.searchParams.set("months", String(months));
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`market-area-detail fetch failed: ${response.status}`);
      }
      return response.json() as Promise<AreaPriceDetail>;
    },
    enabled,
    staleTime: 60_000,
  });

  return {
    detail: data ?? null,
    isLoading: enabled && isLoading,
  };
}
