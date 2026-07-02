/**
 * Reality Gap disclosed suppression thresholds — single source of truth for
 * every piece of COPY that quotes them.
 *
 * Must mirror the c_min_* constants in
 * supabase/migrations/20260702210504_reality_gap_snapshots.sql — the DB
 * refresh function is the computer, these are the disclosed copy.
 *
 * Kept in a pure module (no "server-only") so client components and the
 * framework-free press-pack templates can quote them; re-exported from
 * reality-gap-service for server-side consumers.
 */

/** area_median: minimum active listings per cell (c_min_asking_area). */
export const AREA_MEDIAN_MIN_ASKING_N = 20;

/** area_median: minimum sold transactions per cell (c_min_sold_area). */
export const AREA_MEDIAN_MIN_SOLD_N = 100;

/** matched_pair: minimum confirmed listing-to-sale pairs (c_min_pairs). */
export const MATCHED_PAIR_MIN_N = 10;
