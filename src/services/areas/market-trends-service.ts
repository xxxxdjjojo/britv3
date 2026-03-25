import type { RegionalTrendData, NationalTrendData, MarketTrendKPI } from "@/types/areas";
import { REGIONAL_TRENDS, NATIONAL_TRENDS, MARKET_KPIS, HOT_MARKETS, COLD_MARKETS, YIELD_RANKINGS, getRegionalTrend } from "./mock-data/market-trends";

export async function getRegionalTrends(): Promise<RegionalTrendData[]> {
  return REGIONAL_TRENDS;
}
export async function getNationalTrends(): Promise<NationalTrendData> {
  return NATIONAL_TRENDS;
}
export async function getMarketKPIs(): Promise<MarketTrendKPI[]> {
  return MARKET_KPIS;
}
export async function getRegionalTrendBySlug(slug: string): Promise<RegionalTrendData | null> {
  return getRegionalTrend(slug);
}
export { HOT_MARKETS, COLD_MARKETS, YIELD_RANKINGS };
