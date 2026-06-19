/**
 * Versioned, documented constants for the comparable-sales valuation engine.
 *
 * Every number here is a deliberate modelling choice, not a magic value. Each is
 * documented with its rationale so it can be reviewed, tested, and replaced.
 * Changing any of these should bump MODEL_VERSION and be re-validated by the
 * backtest (see docs/VALUATION_MODEL_SPEC.md / VALUATION_MODEL_VALIDATION.md).
 */

/** Semantic version of the comparable model. Stored on every result for traceability. */
export const MODEL_VERSION = "vmp-comparables-1.1.0";

// --- Recency weighting -------------------------------------------------------
/** Months after which a comparable's recency weight halves. ~1.5y reflects how
 *  quickly local market conditions drift. */
export const RECENCY_HALF_LIFE_MONTHS = 18;

// --- Distance weighting ------------------------------------------------------
/** Distance (metres) e-folding scale. ~750m ≈ a few streets in urban areas. */
export const DISTANCE_SCALE_M = 750;
/** Weight used when a comparable's distance is unknown — neutral, never 0. */
export const NEUTRAL_DISTANCE_WEIGHT = 0.5;

// --- Property-type weighting -------------------------------------------------
/** Weight for two different house sub-types (e.g. detached vs semi). */
export const HOUSE_TO_HOUSE_WEIGHT = 0.6;
/** Weight for a house-vs-flat (or any cross-family) mismatch. */
export const CROSS_FAMILY_WEIGHT = 0.2;

// --- Bedroom weighting -------------------------------------------------------
/** Gaussian sigma (in bedrooms) for bedroom-count similarity. */
export const BEDROOM_SIGMA = 1.2;

// --- Tenure / new-build weighting -------------------------------------------
export const TENURE_MISMATCH_WEIGHT = 0.5;
export const NEW_BUILD_MISMATCH_WEIGHT = 0.4;

// --- Robust estimator --------------------------------------------------------
/** Fraction of total weight trimmed from EACH tail before the trimmed mean.
 *  0.25 (a 25% trimmed mean) keeps a single extreme sale from leaking in even
 *  when it carries high recency/proximity weight — see engine anomaly test. */
export const TRIM_FRACTION = 0.25;
/** Blend of weighted median vs weighted trimmed mean in the central estimate. */
export const MEDIAN_BLEND = 0.5;

// --- Eligibility / sanity bounds --------------------------------------------
/** Reject obviously invalid Land Registry prices (£1 transfers, data errors). */
export const MIN_VALID_PRICE = 10_000;
export const MAX_VALID_PRICE = 100_000_000;

// --- Output formatting -------------------------------------------------------
/** Round the headline estimate to the nearest £5,000 to avoid false precision. */
export const ESTIMATE_ROUNDING = 5_000;

// --- Proximity proxy (until an address gazetteer provides true distances) ----
/** Proxy distance when a comparable shares the subject's full postcode. */
export const PROXIMITY_SAME_POSTCODE_M = 50;
/** Proxy distance when a comparable shares the subject's street (same outward). */
export const PROXIMITY_SAME_STREET_M = 300;

// --- Comparable search windows ----------------------------------------------
/** Preferred recency window (months) before widening. */
export const PREFERRED_WINDOW_MONTHS = 24;
/** Maximum recency window (months) allowed in low-volume areas. */
export const MAX_WINDOW_MONTHS = 36;
