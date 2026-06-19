/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException */
/**
 * Market-map vector-tile service.
 *
 * Helpers shared by the MVT tiles route and the data-version route:
 *  - `decodeByteaToBuffer` — turns a PostgREST-encoded bytea (base64 string OR
 *    `\x`-prefixed hex string) into a Buffer.
 *  - `getDataVersion` — reads the current precompute token from
 *    `market_map_meta.data_version`, memoised in-process and in Redis.
 */

import { getCached, setCache } from "@/lib/cache/redis";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// bytea decoding
// ---------------------------------------------------------------------------

/**
 * Decode a PostgREST-encoded bytea scalar into a Buffer.
 *
 * PostgREST may surface a scalar bytea as either a base64 string (the common
 * case for JSON-encoded scalar returns) or a `\x`-prefixed hex string. Handle
 * both. Returns null for null/empty (no tile for this z/x/y).
 */
export function decodeByteaToBuffer(value: string | null): Buffer | null {
  if (value === null || value === "") return null;

  if (value.startsWith("\\x")) {
    const hex = value.slice(2);
    if (hex === "") return null;
    return Buffer.from(hex, "hex");
  }

  const buf = Buffer.from(value, "base64");
  return buf.length === 0 ? null : buf;
}

// ---------------------------------------------------------------------------
// data version
// ---------------------------------------------------------------------------

const DATA_VERSION_CACHE_KEY = "market-map:data-version";
const DATA_VERSION_TTL_SECONDS = 60;
const DATA_VERSION_FALLBACK = "0";

let memoVersion: { value: string; expiresAt: number } | null = null;

/**
 * Read the current market-map precompute token from `market_map_meta`.
 *
 * Cached in-process (module-level memo, ~60 s) and in Redis (~60 s) to avoid a
 * DB round-trip per tile. Falls back to "0" on any error.
 */
export async function getDataVersion(): Promise<string> {
  const now = Date.now();

  if (memoVersion && memoVersion.expiresAt > now) {
    return memoVersion.value;
  }

  try {
    const cached = await getCached<string>(DATA_VERSION_CACHE_KEY);
    if (cached) {
      memoVersion = { value: cached, expiresAt: now + DATA_VERSION_TTL_SECONDS * 1000 };
      return cached;
    }
  } catch (err) {
    console.error("[market-map] Redis read error for data_version:", err);
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("market_map_meta")
      .select("data_version")
      .limit(1)
      .single();

    if (error || !data?.data_version) {
      return DATA_VERSION_FALLBACK;
    }

    const version = data.data_version as string;
    memoVersion = { value: version, expiresAt: now + DATA_VERSION_TTL_SECONDS * 1000 };

    try {
      await setCache(DATA_VERSION_CACHE_KEY, version, DATA_VERSION_TTL_SECONDS);
    } catch (err) {
      console.error("[market-map] Redis write error for data_version:", err);
    }

    return version;
  } catch (err) {
    console.error("[market-map] data_version lookup failed:", err);
    return DATA_VERSION_FALLBACK;
  }
}
