/* eslint-disable no-console -- Server-side IO function; console.error matches project pattern */
/**
 * Market-map search service.
 *
 * Entry point: searchAreas(q) — calls the market_map_search Postgres function
 * and maps rows to MarketSearchResultDTO.
 *
 * Pure helper: mapSearchRow(row) — converts a raw DB row to a DTO.
 * Exported separately so unit tests can validate it without a DB.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { GeographyLevel } from "@/lib/market-map/geography";

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

export type MarketSearchResultDTO = {
  id: string;
  name: string;
  type: string;
  geography_level: GeographyLevel;
  bbox: [number, number, number, number];
  center: [number, number];
  default_zoom: number;
};

// ---------------------------------------------------------------------------
// Raw DB row shape returned by market_map_search RPC
// ---------------------------------------------------------------------------

type RawSearchRow = {
  id: string;
  name: string;
  type: string;
  geography_level: string;
  center: unknown;   // jsonb — [lng, lat]
  bbox: unknown;     // jsonb — [w, s, e, n]
  default_zoom: number;
};

// ---------------------------------------------------------------------------
// Pure mapper — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * Converts a raw DB row from market_map_search to a MarketSearchResultDTO.
 *
 * Returns null when center or bbox cannot be parsed as the expected numeric
 * arrays (guards against malformed jsonb from the DB).
 */
export function mapSearchRow(row: RawSearchRow): MarketSearchResultDTO | null {
  const center = parseNumericPair(row.center);
  if (center === null) return null;

  const bbox = parseNumericQuad(row.bbox);
  if (bbox === null) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    geography_level: row.geography_level as GeographyLevel,
    center,
    bbox,
    default_zoom: row.default_zoom,
  };
}

// ---------------------------------------------------------------------------
// Internal parsers
// ---------------------------------------------------------------------------

function toFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function parseNumericPair(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const a = toFiniteNumber(value[0]);
  const b = toFiniteNumber(value[1]);
  if (a === null || b === null) return null;
  return [a, b];
}

function parseNumericQuad(
  value: unknown,
): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length < 4) return null;
  const a = toFiniteNumber(value[0]);
  const b = toFiniteNumber(value[1]);
  const c = toFiniteNumber(value[2]);
  const d = toFiniteNumber(value[3]);
  if (a === null || b === null || c === null || d === null) return null;
  return [a, b, c, d];
}

// ---------------------------------------------------------------------------
// searchAreas — async IO
// ---------------------------------------------------------------------------

/**
 * Resolves a free-text query to candidate geographic areas using the
 * market_map_search Postgres function.
 *
 * - Empty / whitespace-only query → returns [] without hitting the DB.
 * - Supabase error → logs and returns [] (graceful degradation).
 * - Rows with unparseable center or bbox are silently skipped.
 */
export async function searchAreas(q: string): Promise<MarketSearchResultDTO[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[market-search] Failed to create admin client:", err);
    return [];
  }

  const { data, error } = await supabase.rpc("market_map_search", {
    p_q: trimmed,
    p_limit: 10,
  });

  if (error) {
    console.error("[market-search] Supabase RPC error:", error.message);
    return [];
  }

  const rows = (data as RawSearchRow[]) ?? [];
  const results: MarketSearchResultDTO[] = [];

  for (const row of rows) {
    const dto = mapSearchRow(row);
    if (dto !== null) results.push(dto);
  }

  return results;
}
