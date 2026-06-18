/* eslint-disable no-console -- Server-side IO function; console.error matches project pattern (see market-map-service.ts) */
/**
 * Area-detail service — flat vs house sold-price breakdown for the
 * selected-area panel.
 *
 *   buildAreaDetail  — pure transformation (no IO; unit-tested)
 *   getAreaDetail    — async IO (calls the market_map_area_detail RPC)
 *
 * Prices from Postgres are in PENCE. This layer divides by 100 (preserving
 * nulls — an empty segment stays null, never 0) and grades confidence per
 * segment from its own transaction count.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { confidenceFor } from "@/lib/market-map/confidence";
import type {
  AreaPriceDetail,
  AreaPriceSegment,
  RawAreaDetail,
  RawAreaDetailSegment,
} from "./types";

const PENCE_PER_POUND = 100;

/** Pence → integer pounds, preserving null (no sales → null, never 0). */
function penceToPounds(pence: number | null | undefined): number | null {
  if (pence == null) return null;
  return Math.round(pence / PENCE_PER_POUND);
}

function toSegment(raw: RawAreaDetailSegment): AreaPriceSegment {
  return {
    median: penceToPounds(raw.median_pence),
    transaction_count: raw.count,
    confidence: confidenceFor(raw.count),
    latest_transaction_date: raw.latest_date ?? null,
  };
}

/**
 * Converts the raw market_map_area_detail jsonb (prices in pence) into an
 * AreaPriceDetail (prices in pounds), grading confidence per segment.
 */
export function buildAreaDetail(raw: RawAreaDetail): AreaPriceDetail {
  return {
    area_id: raw.area_id,
    geography_level: raw.geography_level,
    date_from: raw.date_from,
    date_to: raw.date_to,
    overall: {
      ...toSegment(raw.overall),
      p10: penceToPounds(raw.overall.p10_pence),
      p90: penceToPounds(raw.overall.p90_pence),
    },
    flat: toSegment(raw.flat),
    house: toSegment(raw.house),
  };
}

/**
 * Fetches the flat/house breakdown for a single area via the
 * market_map_area_detail RPC. Uses the admin (service-role) client — call only
 * from server-side code. Returns null on error or when no data is returned.
 */
export async function getAreaDetail(
  level: string,
  areaId: string,
  fromDate?: string | null,
  toDate?: string | null,
): Promise<AreaPriceDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("market_map_area_detail", {
    p_level: level,
    p_area_id: areaId,
    p_from_date: fromDate || null,
    p_to_date: toDate || null,
  });

  if (error) {
    console.error(
      `[area-detail-service] Failed to fetch market_map_area_detail: ${error.message}`,
    );
    return null;
  }
  if (!data) return null;

  return buildAreaDetail(data as RawAreaDetail);
}
