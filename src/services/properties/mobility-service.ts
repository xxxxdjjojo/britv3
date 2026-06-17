/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Mobility scores for the property-detail Local Area widget.
 *
 * Reads precomputed walk/transit/bike scores from the `mobility_scores` table
 * (populated out-of-band by scripts/ingest-mobility-scores.mjs from OpenStreetMap
 * + NaPTAN data). A direct primary-key read on property_id — no external API at
 * render time, which is why scores are precomputed (Overpass is unreliable live).
 *
 * Returns null on any error or when a property has no computed row yet, so
 * callers degrade by absence (never render an empty widget).
 */

import { createClient } from "@/lib/supabase/server";

export type MobilityScores = Readonly<{
  walk: number | null;
  transit: number | null;
  bike: number | null;
  basis: Readonly<{
    walkAmenities: number | null;
    transitStops: number | null;
    bikeCycleways: number | null;
  }>;
}>;

type ScoreRow = {
  walk_score: number | null;
  transit_score: number | null;
  bike_score: number | null;
  walk_amenity_count: number | null;
  transit_stop_count: number | null;
  bike_cycleway_count: number | null;
};

/**
 * Fetch precomputed mobility scores for a property. Returns null when the
 * property has no scores row or the lookup fails.
 */
export async function getMobilityScores(
  propertyId: string,
): Promise<MobilityScores | null> {
  if (!propertyId) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mobility_scores")
      .select(
        "walk_score, transit_score, bike_score, walk_amenity_count, transit_stop_count, bike_cycleway_count",
      )
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) {
      console.error("[mobility-service] lookup failed", {
        error_type: error.code ?? "unknown",
      });
      return null;
    }
    if (!data) return null;

    const row = data as ScoreRow;
    // No usable score at all → degrade by absence.
    if (
      row.walk_score == null &&
      row.transit_score == null &&
      row.bike_score == null
    ) {
      return null;
    }

    return {
      walk: row.walk_score,
      transit: row.transit_score,
      bike: row.bike_score,
      basis: {
        walkAmenities: row.walk_amenity_count,
        transitStops: row.transit_stop_count,
        bikeCycleways: row.bike_cycleway_count,
      },
    };
  } catch (error) {
    console.error("[mobility-service] lookup error", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
