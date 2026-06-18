/**
 * Comparable-sales valuation engine (pure). Given a subject property and a set
 * of candidate registered sales, it filters, time-adjusts, weights, and produces
 * a robust indicative estimate with an evidence rating and honest limitations.
 *
 * It NEVER fabricates a number when evidence is absent (returns Level E / null).
 */
import { isEligibleComparable } from "./eligibility";
import { similarityWeight } from "./weighting";
import { robustEstimate } from "./estimator";
import { timeAdjustPrice, type HpiPoint } from "./hpi";
import { classifyEvidence } from "./evidence";
import { MODEL_VERSION, ESTIMATE_ROUNDING } from "./constants";
import type {
  ValuationSubject,
  ValuationResult,
  ComparableSale,
  PpdPropertyType,
  Tenure,
} from "@/types/valuation";

export type RawComparable = Readonly<{
  transactionId: string;
  price: number;
  saleDate: string; // ISO YYYY-MM-DD
  postcode: string;
  outwardCode: string;
  propertyType: PpdPropertyType;
  newBuild: boolean;
  tenure: Tenure;
  paon: string | null;
  saon: string | null;
  street: string | null;
  district?: string | null;
  distanceMetres: number | null;
  ppdCategory: "A" | "B";
  recordStatus: "A" | "C" | "D";
  bedrooms?: number | null;
}>;

export type ValuateOptions = Readonly<{
  valuationDate: string; // ISO YYYY-MM-DD
  dataCutoffDate?: string | null;
  hpiSeries?: readonly HpiPoint[];
  exactPriorSale?: ComparableSale | null;
}>;

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375;
const MIN_HALF_WIDTH = 0.05;
const MAX_HALF_WIDTH = 0.35;
const QUALITY_FLOOR: Readonly<Record<string, number>> = {
  high: 0.06,
  medium: 0.1,
  low: 0.16,
  unavailable: 0.2,
};
const MAX_EVIDENCE_SHOWN = 12;

function monthsBetween(saleDate: string, valuationDate: string): number {
  const s = Date.parse(`${saleDate}T00:00:00Z`);
  const v = Date.parse(`${valuationDate}T00:00:00Z`);
  return Math.max(0, (v - s) / MS_PER_MONTH);
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function describeInputs(subject: ValuationSubject): { used: string[]; missing: string[] } {
  const fields: ReadonlyArray<[string, unknown]> = [
    ["propertyType", subject.propertyType],
    ["tenure", subject.tenure],
    ["bedrooms", subject.bedrooms],
    ["bathrooms", subject.bathrooms],
    ["floorAreaSqm", subject.floorAreaSqm],
    ["condition", subject.condition],
  ];
  const used: string[] = [];
  const missing: string[] = [];
  for (const [name, value] of fields) {
    if (value === null || value === undefined) missing.push(name);
    else used.push(name);
  }
  return { used, missing };
}

export function valuate(
  subject: ValuationSubject,
  candidates: readonly RawComparable[],
  opts: ValuateOptions,
): ValuationResult {
  const { used: inputsUsed, missing: missingInputs } = describeInputs(subject);
  const eligible = candidates.filter((c) => isEligibleComparable(c));

  // Weight every eligible comparable and time-adjust its price.
  const weighted = eligible.map((c) => {
    const monthsAgo = monthsBetween(c.saleDate, opts.valuationDate);
    const adjustedPrice = opts.hpiSeries
      ? timeAdjustPrice(c.price, c.saleDate, opts.valuationDate, opts.hpiSeries)
      : null;
    const weight = similarityWeight(
      {
        propertyType: c.propertyType,
        tenure: c.tenure,
        newBuild: c.newBuild,
        bedrooms: c.bedrooms ?? null,
        distanceMetres: c.distanceMetres,
        monthsAgo,
      },
      {
        propertyType: subject.propertyType,
        tenure: subject.tenure,
        newBuild: subject.newBuild,
        bedrooms: subject.bedrooms,
      },
    );
    return {
      raw: c,
      monthsAgo,
      adjustedPrice,
      valueForEstimate: adjustedPrice ?? c.price,
      weight,
    };
  });

  const comparableCount = weighted.length;
  const sumW = weighted.reduce((s, w) => s + w.weight, 0);
  const sumW2 = weighted.reduce((s, w) => s + w.weight * w.weight, 0);
  const effectiveComparableCount = sumW2 > 0 ? (sumW * sumW) / sumW2 : 0;
  const sameTypeShare =
    comparableCount === 0
      ? 0
      : weighted.filter((w) => w.raw.propertyType === subject.propertyType).length / comparableCount;
  const distances = weighted
    .map((w) => w.raw.distanceMetres)
    .filter((d): d is number => d !== null);
  const nearestDistanceM = distances.length ? Math.min(...distances) : null;
  const medianMonthsAgo = median(weighted.map((w) => w.monthsAgo));

  const verdict = classifyEvidence({
    hasExactPriorSale: Boolean(opts.exactPriorSale),
    comparableCount,
    effectiveComparableCount,
    nearestDistanceM,
    medianMonthsAgo,
    sameTypeShare,
  });

  const comparableSales: ComparableSale[] = [...weighted]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_EVIDENCE_SHOWN)
    .map((w) => ({
      transactionId: w.raw.transactionId,
      price: w.raw.price,
      adjustedPrice: w.adjustedPrice,
      saleDate: w.raw.saleDate,
      postcode: w.raw.postcode,
      outwardCode: w.raw.outwardCode,
      propertyType: w.raw.propertyType,
      newBuild: w.raw.newBuild,
      tenure: w.raw.tenure,
      paon: w.raw.paon,
      saon: w.raw.saon,
      street: w.raw.street,
      distanceMetres: w.raw.distanceMetres,
      weight: w.weight,
    }));

  const limitations = buildLimitations(verdict.fallbackLevel, subject, medianMonthsAgo, opts);

  // Level E — no responsible estimate.
  if (verdict.fallbackLevel === "E" || comparableCount === 0) {
    return {
      modelVersion: MODEL_VERSION,
      estimatedValue: null,
      estimatedLow: null,
      estimatedHigh: null,
      evidenceQuality: "unavailable",
      fallbackLevel: "E",
      comparableCount,
      effectiveComparableCount,
      valuationDate: opts.valuationDate,
      dataCutoffDate: opts.dataCutoffDate ?? null,
      lastRegisteredSale: opts.exactPriorSale ?? null,
      inputsUsed,
      missingInputs,
      limitations,
      comparableSales,
    };
  }

  const estimateRaw = robustEstimate(
    weighted.map((w) => ({ value: w.valueForEstimate, weight: w.weight })),
  );

  // Range: data dispersion floored by evidence quality (NOT a calibrated CI).
  const mean =
    weighted.reduce((s, w) => s + w.weight * w.valueForEstimate, 0) / (sumW || 1);
  const variance =
    weighted.reduce((s, w) => s + w.weight * (w.valueForEstimate - mean) ** 2, 0) / (sumW || 1);
  const relDispersion = estimateRaw > 0 ? Math.sqrt(variance) / estimateRaw : 0;
  const floor = QUALITY_FLOOR[verdict.evidenceQuality] ?? 0.16;
  const halfWidth = Math.min(MAX_HALF_WIDTH, Math.max(MIN_HALF_WIDTH, relDispersion, floor));

  const estimatedValue = roundToStep(estimateRaw, ESTIMATE_ROUNDING);
  const estimatedLow = roundToStep(estimateRaw * (1 - halfWidth), ESTIMATE_ROUNDING);
  const estimatedHigh = roundToStep(estimateRaw * (1 + halfWidth), ESTIMATE_ROUNDING);

  return {
    modelVersion: MODEL_VERSION,
    estimatedValue,
    estimatedLow,
    estimatedHigh,
    evidenceQuality: verdict.evidenceQuality,
    fallbackLevel: verdict.fallbackLevel,
    comparableCount,
    effectiveComparableCount,
    valuationDate: opts.valuationDate,
    dataCutoffDate: opts.dataCutoffDate ?? null,
    lastRegisteredSale: opts.exactPriorSale ?? null,
    inputsUsed,
    missingInputs,
    limitations,
    comparableSales,
  };
}

function buildLimitations(
  level: ValuationResult["fallbackLevel"],
  subject: ValuationSubject,
  medianMonthsAgo: number | null,
  opts: ValuateOptions,
): string[] {
  const limitations: string[] = [];
  if (level === "E") {
    limitations.push(
      "We can't responsibly produce an instant estimate for this property. We recommend a free valuation from a local estate agent.",
    );
    return limitations;
  }
  if (level === "D") {
    limitations.push(
      "Limited evidence: comparable sales are sparse, distant, or older. Treat this as a broad guide and consider a local agent valuation.",
    );
  }
  if (subject.floorAreaSqm === null) {
    limitations.push("No verified floor area was available, so size is inferred from comparable sales.");
  }
  if ((medianMonthsAgo ?? 0) > 24) {
    limitations.push("Some comparable sales are more than two years old.");
  }
  if (!opts.hpiSeries) {
    limitations.push("Comparable prices are not yet index-adjusted for market movement since sale.");
  }
  limitations.push("Renovations and interior condition are not independently verified.");
  return limitations;
}
