import type { SoldPriceRecord, SoldPriceDetail } from "@/types/areas";
import { getSoldPricesForArea, getSoldPriceDetail as getMockDetail, getAreaSoldPriceSummary } from "./mock-data/sold-prices";

export async function getAreaSoldPrices(areaSlug: string, options?: { limit?: number; offset?: number; propertyType?: string; sortBy?: string }): Promise<{ records: SoldPriceRecord[]; total: number }> {
  // TODO: Query price_paid_data table via existing land-registry service
  const records = getSoldPricesForArea(areaSlug.toLowerCase());
  return { records, total: records.length };
}

export async function getPropertySoldPrice(slug: string): Promise<SoldPriceDetail | null> {
  // TODO: Query by slug from price_paid_data + history
  return getMockDetail(slug.toLowerCase());
}

export async function getSoldPriceStats(areaSlug: string) {
  // TODO: Supabase aggregate query
  return getAreaSoldPriceSummary(areaSlug.toLowerCase());
}
