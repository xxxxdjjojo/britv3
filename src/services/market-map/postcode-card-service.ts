/* eslint-disable no-console -- Server-side IO function; console.error matches project pattern (see area-detail-service.ts) */
/**
 * Postcode-card service — flat vs house price bands for the area a single
 * postcode sits in, read straight from the market-map precompute via the
 * market_map_postcode_card RPC (postcode → geography → fallback ladder).
 *
 *   buildPostcodeCard — pure transformation (no IO; unit-tested)
 *   getPostcodeCard    — async IO (calls the market_map_postcode_card RPC)
 *
 * Prices from Postgres are in PENCE. This layer divides by 100 (preserving
 * nulls — a band with no qualifying level stays null, never 0) and grades
 * confidence per band from its own transaction count. Each band carries the
 * geography level the fallback ladder actually used, so the UI can label the
 * result truthfully.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { confidenceFor } from "@/lib/market-map/confidence";

const PENCE_PER_POUND = 100;

/** Pence → integer pounds, preserving null (no sales → null, never 0). */
function penceToPounds(pence: number | null | undefined): number | null {
  if (pence == null) return null;
  return Math.round(pence / PENCE_PER_POUND);
}

/** Raw band as returned by the market_map_postcode_card RPC (prices in pence). */
export type RawPostcodeBand = {
  median_price_pence?: number | null;
  p10_price_pence?: number | null;
  p90_price_pence?: number | null;
  transaction_count?: number | null;
  level_used?: string | null;
  area_name?: string | null;
  latest_transaction_date?: string | null;
} | null;

/** Raw location block from the RPC (snake_case). */
export type RawPostcodeLocation = {
  postcode_display?: string | null;
  lad_name?: string | null;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;
};

/** Raw jsonb payload from the market_map_postcode_card RPC. */
export type RawPostcodeCard = {
  found: boolean;
  location?: RawPostcodeLocation | null;
  flat?: RawPostcodeBand;
  house?: RawPostcodeBand;
};

/** One band (flat or house) on the postcode card; prices in POUNDS. */
export type PostcodeCardSeries = {
  median: number | null;
  p10: number | null;
  p90: number | null;
  count: number;
  latestDate: string | null;
  confidence: ReturnType<typeof confidenceFor>;
  insufficient: boolean;
  levelUsed: string | null;
  areaName: string | null;
};

/** Resolved location for the postcode (camelCase). */
export type PostcodeLocation = {
  postcodeDisplay: string | null;
  ladName: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
};

export type PostcodeAreaCard = {
  found: boolean;
  location: PostcodeLocation | null;
  flat: PostcodeCardSeries;
  house: PostcodeCardSeries;
};

/** An empty band (null / missing / no level met the min count). */
function insufficientSeries(): PostcodeCardSeries {
  return {
    median: null,
    p10: null,
    p90: null,
    count: 0,
    latestDate: null,
    confidence: confidenceFor(0),
    insufficient: true,
    levelUsed: null,
    areaName: null,
  };
}

function toCardSeries(raw: RawPostcodeBand): PostcodeCardSeries {
  if (raw == null) return insufficientSeries();
  const count = raw.transaction_count ?? 0;
  return {
    median: penceToPounds(raw.median_price_pence),
    p10: penceToPounds(raw.p10_price_pence),
    p90: penceToPounds(raw.p90_price_pence),
    count,
    latestDate: raw.latest_transaction_date ?? null,
    confidence: confidenceFor(count),
    insufficient: count === 0,
    levelUsed: raw.level_used ?? null,
    areaName: raw.area_name ?? null,
  };
}

function toLocation(raw: RawPostcodeLocation | null | undefined): PostcodeLocation | null {
  if (raw == null) return null;
  return {
    postcodeDisplay: raw.postcode_display ?? null,
    ladName: raw.lad_name ?? null,
    region: raw.region ?? null,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
  };
}

/**
 * Converts the raw market_map_postcode_card jsonb (prices in pence) into a
 * PostcodeAreaCard (prices in pounds), grading confidence per band. A not-found
 * postcode yields a null location and two all-insufficient bands.
 */
export function buildPostcodeCard(raw: RawPostcodeCard): PostcodeAreaCard {
  if (!raw.found) {
    return {
      found: false,
      location: null,
      flat: insufficientSeries(),
      house: insufficientSeries(),
    };
  }

  return {
    found: true,
    location: toLocation(raw.location),
    flat: toCardSeries(raw.flat ?? null),
    house: toCardSeries(raw.house ?? null),
  };
}

/**
 * Fetches the flat/house postcode-card bands via the market_map_postcode_card
 * RPC (precompute lookup only). Uses the admin (service-role) client — call
 * only from server-side code. On error, logs and returns an all-insufficient
 * not-found card so callers always get a usable shape.
 */
export async function getPostcodeCard(
  postcode: string,
  window = 12,
): Promise<PostcodeAreaCard> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("market_map_postcode_card", {
    p_postcode: postcode,
    p_window: window,
    p_min_count: 6,
  });

  if (error) {
    console.error(
      `[postcode-card-service] Failed to fetch market_map_postcode_card: ${error.message}`,
    );
    return buildPostcodeCard({ found: false });
  }

  return buildPostcodeCard(data as RawPostcodeCard);
}
