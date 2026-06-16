import { createClient } from "@/lib/supabase/server";
import type {
  AreaPriceTrend,
  PricePaidRecord,
  PricePaidSummary,
  SoldPriceData,
  SoldPriceLookup,
} from "./types";

const DEFAULT_RECENT_LIMIT = 20;
const DEFAULT_YEARS = 5;

const SELECT_COLUMNS =
  "transaction_id, price, date_of_transfer, postcode, property_type, old_new, duration, paon, saon, street, locality, town, district, county, ppd_category, record_status";

/**
 * Extract the outward code (area prefix) from a UK postcode.
 * e.g. "SW1A 1AA" -> "SW1A", "E1 6AN" -> "E1"
 */
function getOutwardCode(postcode: string): string {
  const trimmed = postcode.trim().toUpperCase();
  const spaceIndex = trimmed.lastIndexOf(" ");
  if (spaceIndex > 0) {
    return trimmed.substring(0, spaceIndex);
  }
  return trimmed.length > 4
    ? trimmed.substring(0, trimmed.length - 3)
    : trimmed;
}

function normalisePostcode(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, " ");
}

function normaliseAddressPart(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Recent sales for a postcode area (outward code, e.g. "SW1A").
 */
export async function getPricePaidData(
  postcode: string,
  limit: number = DEFAULT_RECENT_LIMIT,
): Promise<PricePaidRecord[]> {
  const supabase = await createClient();
  const outwardCode = getOutwardCode(postcode);

  const { data, error } = await supabase
    .from("price_paid_data")
    .select(SELECT_COLUMNS)
    .eq("outward_code", outwardCode)
    .order("date_of_transfer", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as PricePaidRecord[];
}

/**
 * Yearly average and transaction count for an area over the last N years.
 */
export async function getAreaPriceTrend(
  postcode: string,
  years: number = DEFAULT_YEARS,
): Promise<AreaPriceTrend[]> {
  const supabase = await createClient();
  const outwardCode = getOutwardCode(postcode);
  const startYear = new Date().getFullYear() - years;
  const startDate = `${startYear}-01-01`;

  const { data, error } = await supabase
    .from("price_paid_data")
    .select("price, date_of_transfer")
    .eq("outward_code", outwardCode)
    .gte("date_of_transfer", startDate);

  if (error || !data || data.length === 0) return [];

  const byYear = new Map<number, { total: number; count: number }>();
  for (const record of data as Array<{
    price: number;
    date_of_transfer: string;
  }>) {
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
 * Combined area-level summary: recent sales + yearly trend + headline average.
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
          recentSales.reduce((sum, sale) => sum + sale.price, 0) /
            recentSales.length,
        )
      : 0;

  return { recentSales, areaTrend, averagePrice };
}

/**
 * Sale history for an exact address. Matches by full postcode + PAON
 * (house number/name) plus optional SAON (flat number) for flats.
 * Returns ALL historical sales for that address — usually 1-5 rows.
 */
export async function getExactPropertySales(
  lookup: SoldPriceLookup,
): Promise<PricePaidRecord[]> {
  const paon = normaliseAddressPart(lookup.paon);
  if (!paon) return [];

  const supabase = await createClient();
  const postcode = normalisePostcode(lookup.postcode);
  const saon = normaliseAddressPart(lookup.saon);

  let query = supabase
    .from("price_paid_data")
    .select(SELECT_COLUMNS)
    .eq("postcode", postcode)
    .eq("paon", paon);
  if (saon) {
    query = query.eq("saon", saon);
  }

  const { data, error } = await query.order("date_of_transfer", {
    ascending: false,
  });
  if (error || !data) return [];
  return data as PricePaidRecord[];
}

/**
 * Combined fetch for the property details page: this property's own sale
 * history + an area-level summary in a single parallel call.
 */
export async function getSoldPriceData(
  lookup: SoldPriceLookup,
): Promise<SoldPriceData> {
  const [exactHistory, areaSummary] = await Promise.all([
    getExactPropertySales(lookup),
    getPricePaidSummary(lookup.postcode),
  ]);
  return { exactHistory, areaSummary };
}
