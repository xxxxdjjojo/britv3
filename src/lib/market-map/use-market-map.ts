import { useQuery } from "@tanstack/react-query";
import type { MarketMapFeatureCollection } from "@/types/market-map";
import type { PropertyTypeFilter } from "@/lib/market-map/constants";

export interface MarketMapParams {
  area: string;
  months: number;
  propertyType: PropertyTypeFilter;
}

export function marketMapSearch(params: MarketMapParams): string {
  const search = new URLSearchParams({
    area: params.area,
    months: String(params.months),
    property_type: params.propertyType,
  });
  return search.toString();
}

async function fetchMarketMap(
  params: MarketMapParams,
): Promise<MarketMapFeatureCollection> {
  const res = await fetch(`/api/market-map?${marketMapSearch(params)}`);
  if (!res.ok) {
    throw new Error(`Failed to load market map (${res.status})`);
  }
  return res.json();
}

export function useMarketMap(params: MarketMapParams) {
  return useQuery({
    queryKey: ["market-map", params.area, params.months, params.propertyType],
    queryFn: () => fetchMarketMap(params),
    staleTime: 5 * 60 * 1000,
  });
}
