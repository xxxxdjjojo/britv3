/**
 * Pure, deterministic mobility scoring for the property-detail Mobility widget.
 *
 * Produces independent 0-100 Walk / Transit / Bike scores from nearby
 * OpenStreetMap features and NaPTAN transport stops. This is NOT the
 * trademarked Walk Score® — it is our own transparent heuristic. All weights
 * and reference maxima are named constants so the model can be tuned without
 * touching the algorithm.
 *
 * Design:
 *  - Walk & Transit use distance-decay (closer features count for more), summed
 *    with per-category/mode caps (diminishing returns), normalised against a
 *    reference maximum representing a "fully served" location.
 *  - Bike uses saturating counts (cycle infrastructure + parking + nearby
 *    amenities for short trips); terrain is intentionally out of scope for v1.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AmenityCategory =
  | "grocery"
  | "food"
  | "school"
  | "health"
  | "park"
  | "retail";

export type WalkAmenity = Readonly<{
  category: AmenityCategory;
  distanceMeters: number;
}>;

export type TransitMode = "rail" | "tube" | "tram" | "ferry" | "bus";

export type TransitStop = Readonly<{
  mode: TransitMode;
  distanceMeters: number;
}>;

export type BikeFeatures = Readonly<{
  cyclewayCount: number;
  bikeParkingCount: number;
  amenityCount: number;
}>;

export type ScoreLabel =
  | "Excellent"
  | "Good"
  | "Moderate"
  | "Limited"
  | "Minimal";

// ---------------------------------------------------------------------------
// Tunable model constants
// ---------------------------------------------------------------------------

const WALK_HALFLIFE_M = 800; // amenity contribution halves every 800 m
const TRANSIT_HALFLIFE_M = 600; // stops further out matter less, faster decay
/** Decay-units per category/mode at which it saturates (diminishing returns). */
const SATURATION = 1.5;

const AMENITY_WEIGHTS: Record<AmenityCategory, number> = {
  grocery: 3,
  food: 2,
  school: 2,
  health: 2,
  park: 1.5,
  retail: 1.5,
};

const TRANSIT_WEIGHTS: Record<TransitMode, number> = {
  rail: 3,
  tube: 3,
  tram: 2,
  ferry: 2,
  bus: 1,
};

// Bike: saturating counts within the query radius, weighted to sum to 1.
const BIKE_CYCLEWAY_SATURATION = 8;
const BIKE_PARKING_SATURATION = 5;
const BIKE_AMENITY_SATURATION = 20;
const BIKE_CYCLEWAY_WEIGHT = 0.55;
const BIKE_PARKING_WEIGHT = 0.15;
const BIKE_AMENITY_WEIGHT = 0.3;

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance between two WGS84 points, in metres. */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Exponential proximity weight: 1 at the point, 0.5 at the half-life, →0 far. */
export function distanceDecay(distanceMeters: number, halfLifeMeters: number): number {
  if (distanceMeters <= 0) return 1;
  return Math.pow(0.5, distanceMeters / halfLifeMeters);
}

const clampScore = (n: number): number =>
  Math.max(0, Math.min(100, Math.round(n)));

export function scoreLabel(score: number): ScoreLabel {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Limited";
  return "Minimal";
}

/**
 * Sum distance-decayed contributions per group, cap each group at
 * `weight * SATURATION` (diminishing returns), and normalise the total against
 * the maximum achievable (every group saturated) to a 0-100 score.
 */
function weightedProximityScore<K extends string>(
  items: ReadonlyArray<{ group: K; distanceMeters: number }>,
  weights: Record<K, number>,
  halfLifeMeters: number,
  refMax: number,
): number {
  const perGroup = new Map<K, number>();
  for (const item of items) {
    const w = weights[item.group];
    if (!w) continue;
    const cap = w * SATURATION;
    const next = (perGroup.get(item.group) ?? 0) + w * distanceDecay(item.distanceMeters, halfLifeMeters);
    perGroup.set(item.group, Math.min(cap, next));
  }
  const raw = [...perGroup.values()].reduce((sum, v) => sum + v, 0);
  return clampScore((raw / refMax) * 100);
}

/** Sum of the top `n` weights × SATURATION — a realistic "fully served" target. */
function topNRefMax(weights: Record<string, number>, n: number): number {
  const top = Object.values(weights).sort((a, b) => b - a).slice(0, n);
  return top.reduce((sum, w) => sum + w * SATURATION, 0);
}

/** Sum of all weights × SATURATION — reference for "every category present". */
function fullRefMax(weights: Record<string, number>): number {
  return Object.values(weights).reduce((sum, w) => sum + w * SATURATION, 0);
}

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export function computeWalkScore(amenities: ReadonlyArray<WalkAmenity>): number {
  // A truly walkable place has every category nearby — reference all of them.
  return weightedProximityScore(
    amenities.map((a) => ({ group: a.category, distanceMeters: a.distanceMeters })),
    AMENITY_WEIGHTS,
    WALK_HALFLIFE_M,
    fullRefMax(AMENITY_WEIGHTS),
  );
}

export function computeTransitScore(stops: ReadonlyArray<TransitStop>): number {
  // transport_stops is rapid-transit stations only (no bus), and almost no
  // location has all modes — reference the two highest-value modes, so being
  // near a couple of rail/tube stations already scores as excellent transit.
  return weightedProximityScore(
    stops.map((s) => ({ group: s.mode, distanceMeters: s.distanceMeters })),
    TRANSIT_WEIGHTS,
    TRANSIT_HALFLIFE_M,
    topNRefMax(TRANSIT_WEIGHTS, 2),
  );
}

export function computeBikeScore(features: BikeFeatures): number {
  const cycleway = Math.min(1, features.cyclewayCount / BIKE_CYCLEWAY_SATURATION);
  const parking = Math.min(1, features.bikeParkingCount / BIKE_PARKING_SATURATION);
  const amenity = Math.min(1, features.amenityCount / BIKE_AMENITY_SATURATION);
  return clampScore(
    100 *
      (BIKE_CYCLEWAY_WEIGHT * cycleway +
        BIKE_PARKING_WEIGHT * parking +
        BIKE_AMENITY_WEIGHT * amenity),
  );
}
