/**
 * Similarity weighting for comparable sales. Each factor returns a weight in
 * (0, 1]; the overall similarity weight is their product. Higher = more like the
 * subject property and therefore more influential in the estimate.
 */
import {
  RECENCY_HALF_LIFE_MONTHS,
  DISTANCE_SCALE_M,
  NEUTRAL_DISTANCE_WEIGHT,
  HOUSE_TO_HOUSE_WEIGHT,
  CROSS_FAMILY_WEIGHT,
  BEDROOM_SIGMA,
  TENURE_MISMATCH_WEIGHT,
  NEW_BUILD_MISMATCH_WEIGHT,
} from "./constants";
import type { PpdPropertyType, Tenure } from "@/types/valuation";

const HOUSE_TYPES: ReadonlySet<PpdPropertyType> = new Set(["D", "S", "T"]);

/** Exponential recency decay; 1 for a sale today, halving every half-life. */
export function recencyWeight(monthsAgo: number): number {
  const m = Math.max(0, monthsAgo);
  return Math.pow(2, -m / RECENCY_HALF_LIFE_MONTHS);
}

/** Exponential distance decay; 1 at the subject location, neutral when unknown. */
export function distanceWeight(metres: number | null): number {
  if (metres === null || !Number.isFinite(metres)) return NEUTRAL_DISTANCE_WEIGHT;
  return Math.exp(-Math.max(0, metres) / DISTANCE_SCALE_M);
}

/** Property-type similarity: exact > same family (house↔house) > cross-family. */
export function propertyTypeWeight(a: PpdPropertyType, b: PpdPropertyType): number {
  if (a === b) return 1;
  if (HOUSE_TYPES.has(a) && HOUSE_TYPES.has(b)) return HOUSE_TO_HOUSE_WEIGHT;
  return CROSS_FAMILY_WEIGHT;
}

/** Bedroom similarity (Gaussian). Neutral (1) when either count is unknown. */
export function bedroomWeight(a: number | null, b: number | null): number {
  if (a === null || b === null) return 1;
  const diff = a - b;
  return Math.exp(-(diff * diff) / (2 * BEDROOM_SIGMA * BEDROOM_SIGMA));
}

export function tenureWeight(a: Tenure, b: Tenure): number {
  return a === b ? 1 : TENURE_MISMATCH_WEIGHT;
}

export function newBuildWeight(a: boolean, b: boolean): number {
  return a === b ? 1 : NEW_BUILD_MISMATCH_WEIGHT;
}

export type WeightingComparable = Readonly<{
  propertyType: PpdPropertyType;
  tenure: Tenure;
  newBuild: boolean;
  bedrooms: number | null;
  distanceMetres: number | null;
  monthsAgo: number;
}>;

export type WeightingSubject = Readonly<{
  propertyType: PpdPropertyType;
  tenure: Tenure;
  newBuild: boolean;
  bedrooms: number | null;
}>;

/** Product of all similarity factors for one comparable against the subject. */
export function similarityWeight(comp: WeightingComparable, subject: WeightingSubject): number {
  return (
    recencyWeight(comp.monthsAgo) *
    distanceWeight(comp.distanceMetres) *
    propertyTypeWeight(comp.propertyType, subject.propertyType) *
    bedroomWeight(comp.bedrooms, subject.bedrooms) *
    tenureWeight(comp.tenure, subject.tenure) *
    newBuildWeight(comp.newBuild, subject.newBuild)
  );
}
