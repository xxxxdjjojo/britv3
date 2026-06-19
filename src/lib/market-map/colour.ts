/**
 * Choropleth colour scale for the market price map.
 *
 * Scale: log10(price) → 9 buckets.
 * Bucket hex values from DESIGN.md §4.2 (authoritative table — all 9 hexes explicit).
 *
 * Green (bucket 1) = lower relative price.
 * Gold  (bucket 5) = middle.
 * Burgundy (bucket 9) = higher relative price.
 * Grey = insufficient data (<5 transactions or null price).
 */

import { clamp } from "./stats";

/** Grey fill shown when there are fewer than 5 transactions or price is null. */
export const INSUFFICIENT_COLOUR = "#9E9EAB";

/**
 * Canonical hex values for buckets 1–9, sourced directly from DESIGN.md §4.2.
 * Index 0 = bucket 1, index 8 = bucket 9.
 */
const BUCKET_COLOURS: readonly string[] = [
  "#2D5A3D", // bucket 1 — forest green (anchor)
  "#4A7A52", // bucket 2
  "#7A9E6A", // bucket 3
  "#B5C48A", // bucket 4
  "#C9A84C", // bucket 5 — muted gold (anchor)
  "#C08A3A", // bucket 6
  "#A06030", // bucket 7
  "#8B3A28", // bucket 8
  "#6B1A1A", // bucket 9 — deep burgundy (anchor)
];

/**
 * Returns the hex colour for a given bucket (1–9).
 * Input must be an integer in [1, 9].
 */
export function colourForBucket(bucket: number): string {
  return BUCKET_COLOURS[bucket - 1];
}

/**
 * Maps a price to a bucket 1–9 using a log10 scale within the provided domain.
 *
 * @param price - The price to classify (pence or £; must use the same unit as `domain`).
 * @param domain - `{ lo, hi }` price bounds (e.g. p5/p95 of the comparison set).
 *                 Prices ≤ lo → bucket 1; prices ≥ hi → bucket 9.
 *
 * Degenerate case: if lo === hi, returns bucket 5 (middle).
 */
export function assignBucket(
  price: number,
  domain: { lo: number; hi: number },
): number {
  const { lo, hi } = domain;

  if (lo === hi) return 5;

  const logLo = Math.log10(lo);
  const logHi = Math.log10(hi);
  const logPrice = Math.log10(clamp(price, lo, hi));

  const t = (logPrice - logLo) / (logHi - logLo);

  // Map t ∈ [0, 1] → bucket 1..9
  // t=0 → bucket 1, t=1 → bucket 9
  const bucket = Math.min(9, Math.floor(t * 9) + 1);
  return bucket;
}

/**
 * Returns the fill colour and bucket for a choropleth area.
 *
 * Returns `{ bucket: null, fill: INSUFFICIENT_COLOUR }` when:
 *   - `transactionCount` is less than 5, OR
 *   - `price` is null.
 *
 * Otherwise returns the bucket (1–9) and its corresponding hex fill.
 */
export function priceColour(
  price: number | null,
  transactionCount: number,
  domain: { lo: number; hi: number },
): { bucket: number | null; fill: string } {
  if (price === null || transactionCount < 5) {
    return { bucket: null, fill: INSUFFICIENT_COLOUR };
  }

  const bucket = assignBucket(price, domain);
  return { bucket, fill: colourForBucket(bucket) };
}
