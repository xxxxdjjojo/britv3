/**
 * Crime statistics from data.police.uk (UK Police open data, Open Government
 * Licence v3). Aggregates street-level crime counts by category for the most
 * recent available month near a property's coordinates. Redis-cached 7 days.
 *
 * Returns null on any error or when there is no data — callers degrade by
 * absence (never render a placeholder widget).
 *
 * CRITICAL SECURITY: coordinates are never included in error messages.
 */

import { getCached, setCache } from "@/lib/cache/redis";

const LAST_UPDATED_URL = "https://data.police.uk/api/crime-last-updated";
const STREET_CRIME_URL = "https://data.police.uk/api/crimes-street/all-crime";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const FETCH_TIMEOUT_MS = 9000;

export type CrimeCategoryStat = Readonly<{ category: string; count: number }>;

export type AreaCrime = Readonly<{
  stats: CrimeCategoryStat[];
  boroughAvg: number | null;
  /** Reporting month, "YYYY-MM". */
  month: string;
}>;

/** "anti-social-behaviour" -> "Anti social behaviour". */
export function humaniseCategory(category: string): string {
  const cleaned = category.replace(/-/g, " ").trim();
  if (cleaned.length === 0) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Aggregate raw police.uk street-crime records into per-category counts,
 * sorted by descending count. Pure — safe to unit test without network.
 */
export function aggregateCrimeByCategory(raw: unknown): CrimeCategoryStat[] {
  if (!Array.isArray(raw)) return [];
  const counts = new Map<string, number>();
  for (const item of raw) {
    const category = (item as { category?: unknown }).category;
    if (typeof category !== "string" || category.length === 0) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category: humaniseCategory(category), count }))
    .sort((a, b) => b.count - a.count);
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export async function getAreaCrime(
  lat: number,
  lng: number,
): Promise<AreaCrime | null> {
  const cacheKey = `crime:lat:${lat.toFixed(3)}:lng:${lng.toFixed(3)}`;
  const cached = await getCached<AreaCrime>(cacheKey);
  if (cached) return cached;

  // Determine the latest month the dataset covers (data lags ~2 months).
  const updated = await fetchJson(LAST_UPDATED_URL);
  const date = (updated as { date?: unknown } | null)?.date;
  const month = typeof date === "string" ? date.slice(0, 7) : null;
  if (!month) return null;

  const raw = await fetchJson(
    `${STREET_CRIME_URL}?lat=${lat}&lng=${lng}&date=${month}`,
  );
  const stats = aggregateCrimeByCategory(raw);
  if (stats.length === 0) return null;

  const result: AreaCrime = { stats, boroughAvg: null, month };
  await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}
