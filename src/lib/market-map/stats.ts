/**
 * Pure statistical utilities for the market price map choropleth.
 * No IO, no side effects. Safe to import in any context.
 */

/**
 * Computes the p-th percentile of an array of numbers using type-7 / numpy
 * default linear interpolation (equivalent to Postgres `percentile_cont`).
 *
 * @param values - Input values (not mutated; sorted internally).
 * @param p - Percentile in [0, 100].
 * @throws RangeError if `values` is empty or `p` is outside [0, 100].
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    throw new RangeError("percentile: values array must not be empty");
  }
  if (p < 0 || p > 100) {
    throw new RangeError(`percentile: p must be in [0, 100], got ${p}`);
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 1) return sorted[0];

  // Type-7 method: virtual index = p/100 * (n-1)
  const idx = (p / 100) * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;

  return sorted[lo] + frac * (sorted[hi] - sorted[lo]);
}

/**
 * Returns the median of an array of numbers.
 * Equivalent to `percentile(values, 50)`.
 *
 * @throws RangeError if `values` is empty.
 */
export function median(values: readonly number[]): number {
  return percentile(values, 50);
}

/**
 * Returns the lo/hi price values used as the choropleth colour domain.
 * Defaults to p5 (lo) and p95 (hi) — matches Postgres `percentile_cont`.
 *
 * @param values - Price values (not mutated).
 * @param loPercentile - Lower percentile cutoff (default 5).
 * @param hiPercentile - Upper percentile cutoff (default 95).
 */
export function computeClampBounds(
  values: readonly number[],
  loPercentile = 5,
  hiPercentile = 95,
): { lo: number; hi: number } {
  return {
    lo: percentile(values, loPercentile),
    hi: percentile(values, hiPercentile),
  };
}

/**
 * Clamps `value` to the inclusive range [lo, hi].
 */
export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}
