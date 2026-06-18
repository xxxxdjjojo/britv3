/**
 * Shared types for the "Value my property" valuation feature.
 * HM Land Registry codes are used directly where they are the source of truth.
 */

/** HMLR property_type: Detached, Semi, Terraced, Flat/maisonette, Other. */
export type PpdPropertyType = "D" | "S" | "T" | "F" | "O";

/** HMLR duration: Freehold or Leasehold. */
export type Tenure = "F" | "L";

/** User-facing tenure including options HMLR does not record. */
export type UserTenure = "freehold" | "leasehold" | "share_of_freehold" | "unknown";

/** General condition band supplied by the user. */
export type Condition =
  | "needs_major_work"
  | "below_average"
  | "average"
  | "good"
  | "recently_renovated";

/** How confident the evidence behind an estimate is. NOT an accuracy percentage. */
export type EvidenceQuality = "high" | "medium" | "low" | "unavailable";

/**
 * Adaptive fallback level:
 * A = exact prior sale + strong nearby comparables
 * B = highly similar nearby comparables
 * C = broader neighbourhood comparables with characteristics
 * D = postcode-sector / local-area property-type estimate
 * E = no responsible instant estimate (recommend agent valuation)
 */
export type FallbackLevel = "A" | "B" | "C" | "D" | "E";

/** A comparable registered sale used as evidence. */
export type ComparableSale = Readonly<{
  transactionId: string;
  price: number; // whole pounds, as registered
  adjustedPrice: number | null; // time-adjusted to valuation date, if HPI applied
  saleDate: string; // ISO YYYY-MM-DD
  postcode: string;
  outwardCode: string;
  propertyType: PpdPropertyType;
  newBuild: boolean;
  tenure: Tenure;
  paon: string | null;
  saon: string | null;
  street: string | null;
  distanceMetres: number | null;
  weight: number; // similarity weight assigned by the engine
}>;

/** House subtype options shown to the user (maps to a PPD property type). */
export type HouseSubtype =
  | "detached"
  | "semi_detached"
  | "terraced"
  | "end_terrace"
  | "bungalow"
  | "flat"
  | "other";

/** Property characteristics as captured from the user in the details step. */
export type UserPropertyDetails = Readonly<{
  subtype: HouseSubtype;
  bedrooms: number | null;
  bathrooms: number | null;
  floorAreaSqm: number | null;
  tenure: UserTenure;
  newBuild: boolean;
  condition: Condition | null;
  hasExtensionOrLoft: boolean;
  parking: boolean;
  garden: boolean;
}>;

/** Address chosen in the address step. */
export type SelectedAddress = Readonly<{
  postcode: string;
  outwardCode: string;
  paon: string | null;
  saon: string | null;
  street: string | null;
  label: string;
}>;

/** Subject property characteristics the engine reasons over. */
export type ValuationSubject = Readonly<{
  postcode: string;
  outwardCode: string;
  propertyType: PpdPropertyType;
  tenure: Tenure;
  newBuild: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  floorAreaSqm: number | null;
  condition: Condition | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
}>;

/** The full engine output. Mirrors the documented return shape. */
export type ValuationResult = Readonly<{
  modelVersion: string;
  estimatedValue: number | null; // null when no responsible estimate (Level E)
  estimatedLow: number | null;
  estimatedHigh: number | null;
  evidenceQuality: EvidenceQuality;
  fallbackLevel: FallbackLevel;
  comparableCount: number;
  effectiveComparableCount: number;
  valuationDate: string;
  dataCutoffDate: string | null;
  lastRegisteredSale: ComparableSale | null;
  inputsUsed: readonly string[];
  missingInputs: readonly string[];
  limitations: readonly string[];
  comparableSales: readonly ComparableSale[];
}>;
