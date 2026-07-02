/* eslint-disable no-console -- Server-side IO functions; console.error matches project pattern (see postcode-card-service.ts) */
/**
 * PPD postcode service — recent real sales for a single postcode plus a
 * 12-month sold-price trend for its postcode SECTOR, read straight from
 * `ppd_transactions` (HM Land Registry Price Paid Data).
 *
 *   buildRecentSales / buildSectorTrend — pure transforms (no IO; unit-tested)
 *   getRecentSalesForPostcode / getSectorTrend — async IO (admin client)
 *
 * GROUND RULE: real PPD rows only — price, date, property type. No estimates,
 * no growth figures, no per-property valuations. Rows missing a price or date
 * are dropped, and the trend self-gates (`insufficient: true`) below
 * TREND_MIN_TOTAL_SALES so the UI renders nothing rather than a thin figure.
 *
 * Prices in Postgres are in PENCE; this layer converts to whole pounds.
 * IO functions never throw — they log and return an empty shape.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { normalisePostcode } from "@/lib/market-map/postcode";

const PENCE_PER_POUND = 100;

/** A sector trend needs at least this many sales in 12 months to render. */
export const TREND_MIN_TOTAL_SALES = 30;

/** Default number of recent sales returned for a postcode. */
const DEFAULT_RECENT_SALES_LIMIT = 12;

/** Safety cap on sector rows pulled for the trend bucketing. */
const SECTOR_ROW_CAP = 2000;

/** PPD property_type codes → honest labels. */
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat/maisonette",
  O: "Other",
};

/** Row shape read from ppd_transactions for the recent-sales list. */
export type PpdRecentSaleRow = {
  ppd_tuid: string;
  price_pence: number | null;
  transfer_date: string | null;
  property_type: string | null;
  street: string | null;
  paon: string | null;
  new_build: boolean | null;
};

/** Row shape read from ppd_transactions for the sector trend. */
export type PpdTrendRow = {
  price_pence: number | null;
  transfer_date: string | null;
};

export type RecentSale = {
  id: string;
  pricePounds: number;
  /** ISO transfer date, e.g. "2026-03-14". */
  date: string;
  propertyTypeLabel: string;
  /** "12 Acacia Avenue" — paon + street, title-cased. May be "". */
  street: string;
  newBuild: boolean;
};

export type SectorTrendMonth = {
  /** Calendar month, e.g. "2026-03". */
  month: string;
  /** Median sold price for the month, whole pounds. */
  median: number;
  count: number;
};

export type SectorTrend = {
  /** The sector the trend describes, e.g. "DA1 1". Null when underivable. */
  sector: string | null;
  /** Ascending calendar months that had at least one sale. */
  months: SectorTrendMonth[];
  totalCount: number;
  /** True below TREND_MIN_TOTAL_SALES — the UI must render nothing. */
  insufficient: boolean;
};

/** "ACACIA AVENUE" → "Acacia Avenue" (numbers pass through untouched). */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s\-/])([a-z])/g, (_, boundary: string, letter: string) => {
      return boundary + letter.toUpperCase();
    });
}

function propertyTypeLabel(code: string | null): string {
  if (!code) return PROPERTY_TYPE_LABELS.O;
  return PROPERTY_TYPE_LABELS[code.toUpperCase()] ?? PROPERTY_TYPE_LABELS.O;
}

/**
 * Maps raw ppd_transactions rows to RecentSale, dropping any row without a
 * real price or transfer date (never fabricate, never default to 0).
 */
export function buildRecentSales(rows: ReadonlyArray<PpdRecentSaleRow>): RecentSale[] {
  return rows.flatMap((row) => {
    if (row.price_pence == null || !row.transfer_date) return [];
    const address = [row.paon, row.street].filter(Boolean).join(" ").trim();
    return [
      {
        id: row.ppd_tuid,
        pricePounds: Math.round(row.price_pence / PENCE_PER_POUND),
        date: row.transfer_date,
        propertyTypeLabel: propertyTypeLabel(row.property_type),
        street: address ? titleCase(address) : "",
        newBuild: row.new_build === true,
      },
    ];
  });
}

/** "2026-03" month key for an ISO date string, or null when unparsable. */
function monthKey(isoDate: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(isoDate);
  return match ? `${match[1]}-${match[2]}` : null;
}

/** Median of a non-empty list of pence values, converted to whole pounds. */
function medianPounds(penceValues: number[]): number {
  const sorted = [...penceValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianPence =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(medianPence / PENCE_PER_POUND);
}

/** First day of the calendar month `monthsBack` months before `now` (UTC). */
function windowStart(now: Date, monthsBack: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
}

/**
 * Buckets sector sales by calendar month and takes the median per month.
 * Only months inside the trailing 12 calendar months (relative to `now`) and
 * with at least one real sale appear — empty months are omitted, never
 * zero-filled. Self-gates: `insufficient` is true below TREND_MIN_TOTAL_SALES.
 */
export function buildSectorTrend(
  rows: ReadonlyArray<PpdTrendRow>,
  now: Date = new Date(),
  sector: string | null = null,
): SectorTrend {
  const earliest = windowStart(now, 11);
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    if (row.price_pence == null || !row.transfer_date) continue;
    const key = monthKey(row.transfer_date);
    if (!key) continue;
    const bucketDate = new Date(`${key}-01T00:00:00Z`);
    if (Number.isNaN(bucketDate.getTime()) || bucketDate < earliest || bucketDate > now) {
      continue;
    }
    const bucket = buckets.get(key) ?? [];
    bucket.push(row.price_pence);
    buckets.set(key, bucket);
  }

  const months: SectorTrendMonth[] = [...buckets.entries()]
    .map(([month, prices]) => ({
      month,
      median: medianPounds(prices),
      count: prices.length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalCount = months.reduce((sum, m) => sum + m.count, 0);

  return {
    sector,
    months,
    totalCount,
    insufficient: totalCount < TREND_MIN_TOTAL_SALES,
  };
}

/** An empty, insufficient trend (invalid postcode / query error). */
function emptyTrend(sector: string | null = null): SectorTrend {
  return { sector, months: [], totalCount: 0, insufficient: true };
}

/**
 * The most recent registered sales for one full postcode, newest first.
 * Deleted PPD records (last_record_status = 'D') are excluded.
 * Never throws — logs and returns [] on any error.
 */
export async function getRecentSalesForPostcode(
  postcode: string,
  limit = DEFAULT_RECENT_SALES_LIMIT,
): Promise<RecentSale[]> {
  const normalised = normalisePostcode(postcode);
  if (!normalised) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ppd_transactions")
      .select("ppd_tuid, price_pence, transfer_date, property_type, street, paon, new_build")
      .eq("postcode", normalised.display)
      .neq("last_record_status", "D")
      .order("transfer_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        `[ppd-postcode-service] recent sales query failed: ${error.message}`,
      );
      return [];
    }

    return buildRecentSales((data ?? []) as PpdRecentSaleRow[]);
  } catch (error: unknown) {
    console.error("[ppd-postcode-service] recent sales lookup threw", error);
    return [];
  }
}

/**
 * 12-month monthly-median trend for the postcode's SECTOR (outward code +
 * first inward digit, e.g. "DA1 1"). Self-gated below TREND_MIN_TOTAL_SALES.
 * Never throws — logs and returns an empty insufficient trend on any error.
 */
export async function getSectorTrend(postcode: string): Promise<SectorTrend> {
  const normalised = normalisePostcode(postcode);
  if (!normalised) return emptyTrend();

  const sector = normalised.sector;
  const since = windowStart(new Date(), 11).toISOString().slice(0, 10);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ppd_transactions")
      .select("price_pence, transfer_date")
      .like("postcode", `${sector}%`)
      .gte("transfer_date", since)
      .neq("last_record_status", "D")
      .limit(SECTOR_ROW_CAP);

    if (error) {
      console.error(`[ppd-postcode-service] sector trend query failed: ${error.message}`);
      return emptyTrend(sector);
    }

    return buildSectorTrend((data ?? []) as PpdTrendRow[], new Date(), sector);
  } catch (error: unknown) {
    console.error("[ppd-postcode-service] sector trend lookup threw", error);
    return emptyTrend(sector);
  }
}
