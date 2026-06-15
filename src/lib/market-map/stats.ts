/**
 * Quantile / median helpers used by the colour scale and aggregation.
 *
 * Uses linear interpolation between closest ranks (the "type 7" method, as used
 * by NumPy and d3.quantile). Inputs are not mutated.
 */

/**
 * Quantile of a numeric array. `q` is clamped to [0, 1].
 * Returns NaN for an empty array.
 */
export function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.min(1, Math.max(0, q));
  const pos = (sorted.length - 1) * clamped;
  const base = Math.floor(pos);
  const rest = pos - base;
  const lower = sorted[base];
  const upper = sorted[base + 1] ?? lower;
  return lower + rest * (upper - lower);
}

/** Median (50th percentile). Returns NaN for an empty array. */
export function median(values: readonly number[]): number {
  return quantile(values, 0.5);
}
