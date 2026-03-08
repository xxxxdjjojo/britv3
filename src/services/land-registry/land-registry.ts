import { createClient } from "@/lib/supabase/server";
import type { AreaPriceTrend, PricePaidRecord, PricePaidSummary } from "./types";

const DEFAULT_RECENT_LIMIT = 20;
const DEFAULT_YEARS = 5;

/**
 * Extract the outward code (area prefix) from a UK postcode.
 * e.g. "SW1A 1AA" -> "SW1A", "E1 6AN" -> "E1"
 */
function getOutwardCode(postcode: string): string {
  const trimmed = postcode.trim().toUpperCase();
  // UK postcodes: outward code is everything before the space
  const spaceIndex = trimmed.lastIndexOf(" ");
  if (spaceIndex > 0) {
    return trimmed.substring(0, spaceIndex);
  }
  // If no space, take first part (could be 2-4 chars)
  // Outward codes are 2-4 characters
  return trimmed.length > 4 ? trimmed.substring(0, trimmed.length - 3) : trimmed;
}

/**
 * Get recent price paid records for a postcode area.
 * Queries by outward code (e.g. "SW1A") to show nearby sales.
 */
export async function getPricePaidData(
  postcode: string,
  limit: number = DEFAULT_RECENT_LIMIT,
): Promise<PricePaidRecord[]> {
  const supabase = await createClient();
  const outwardCode = getOutwardCode(postcode);

  const { data, error } = await supabase
    .from("price_paid_data")
    .select("*")
    .ilike("postcode", `${outwardCode}%`)
    .order("date_of_transfer", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as PricePaidRecord[];
}

/**
 * Get area price trends grouped by year for a postcode area.
 * Returns average price and transaction count per year.
 */
export async function getAreaPriceTrend(
  postcode: string,
  years: number = DEFAULT_YEARS,
): Promise<AreaPriceTrend[]> {
  const supabase = await createClient();
  const outwardCode = getOutwardCode(postcode);
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years;
  const startDate = `${startYear}-01-01`;

  const { data, error } = await supabase
    .from("price_paid_data")
    .select("price, date_of_transfer")
    .ilike("postcode", `${outwardCode}%`)
    .gte("date_of_transfer", startDate)
    .order("date_of_transfer", { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  // Group by year and calculate averages
  const byYear = new Map<number, { total: number; count: number }>();

  for (const record of data) {
    const year = new Date(record.date_of_transfer).getFullYear();
    const existing = byYear.get(year) ?? { total: 0, count: 0 };
    existing.total += record.price;
    existing.count += 1;
    byYear.set(year, existing);
  }

  const trends: AreaPriceTrend[] = [];
  for (const [year, { total, count }] of byYear) {
    trends.push({
      year,
      averagePrice: Math.round(total / count),
      transactionCount: count,
    });
  }

  trends.sort((a, b) => a.year - b.year);
  return trends;
}

/**
 * Get a complete price paid summary for a postcode area.
 * Combines recent sales, area trends, and current average price.
 */
export async function getPricePaidSummary(
  postcode: string,
): Promise<PricePaidSummary> {
  const [recentSales, areaTrend] = await Promise.all([
    getPricePaidData(postcode),
    getAreaPriceTrend(postcode),
  ]);

  const averagePrice =
    recentSales.length > 0
      ? Math.round(
          recentSales.reduce((sum, sale) => sum + sale.price, 0) / recentSales.length,
        )
      : 0;

  return {
    recentSales,
    areaTrend,
    averagePrice,
  };
}
