/**
 * Robust central-estimate maths for the comparable-sales engine.
 *
 * Land Registry prices are right-skewed and contain anomalies (£1 transfers,
 * bulk/portfolio sales). We therefore never use a plain mean — the headline
 * estimate is a blend of a weighted median and a weighted trimmed mean, both of
 * which resist a single unusually-priced sale.
 */
import { MEDIAN_BLEND, TRIM_FRACTION } from "./constants";

type Pair = { v: number; w: number };

function toSortedPairs(values: readonly number[], weights: readonly number[]): Pair[] {
  if (values.length === 0) throw new Error("estimator: empty input");
  if (values.length !== weights.length) {
    throw new Error("estimator: values/weights length mismatch");
  }
  return values
    .map((v, i) => ({ v, w: weights[i] }))
    .sort((a, b) => a.v - b.v);
}

/** Value at which cumulative weight first reaches half of the total. */
export function weightedMedian(values: readonly number[], weights: readonly number[]): number {
  const pairs = toSortedPairs(values, weights);
  const total = pairs.reduce((s, p) => s + p.w, 0);
  if (total <= 0) throw new Error("estimator: non-positive total weight");
  const half = total / 2;
  let cum = 0;
  for (const p of pairs) {
    cum += p.w;
    if (cum >= half) return p.v;
  }
  return pairs[pairs.length - 1].v;
}

/**
 * Weighted mean after removing `trimFraction` of total weight from each tail.
 * Fractional weights at the cut boundary are partially included.
 */
export function weightedTrimmedMean(
  values: readonly number[],
  weights: readonly number[],
  trimFraction: number,
): number {
  const pairs = toSortedPairs(values, weights);
  const total = pairs.reduce((s, p) => s + p.w, 0);
  if (total <= 0) throw new Error("estimator: non-positive total weight");
  const lo = total * trimFraction;
  const hi = total - total * trimFraction;

  let cum = 0;
  let num = 0;
  let den = 0;
  for (const p of pairs) {
    const start = cum;
    const end = cum + p.w;
    const eff = Math.max(0, Math.min(end, hi) - Math.max(start, lo));
    num += p.v * eff;
    den += eff;
    cum = end;
  }
  // Degenerate (everything trimmed): fall back to the weighted median.
  return den > 0 ? num / den : weightedMedian(values, weights);
}

/** Blended robust central estimate from {value, weight} comparables. */
export function robustEstimate(
  comps: ReadonlyArray<{ value: number; weight: number }>,
): number {
  if (comps.length === 0) throw new Error("estimator: no comparables");
  const values = comps.map((c) => c.value);
  const weights = comps.map((c) => c.weight);
  const median = weightedMedian(values, weights);
  const trimmed = weightedTrimmedMean(values, weights, TRIM_FRACTION);
  return MEDIAN_BLEND * median + (1 - MEDIAN_BLEND) * trimmed;
}
