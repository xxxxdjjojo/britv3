/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Nearby transport stations for the property-detail Local Area widget.
 *
 * Data is served from our own `transport_stops` table (NaPTAN station data,
 * DfT Open Government Licence v3.0), queried via the get_nearby_transport_stops
 * PostGIS RPC. Unlike the crime/schools layers this needs no external API at
 * render time — the table is populated out-of-band by scripts/ingest-naptan.mjs.
 *
 * Returns null on any error or when there is no nearby data, so callers degrade
 * by absence (never render an empty widget). Coordinates are never echoed in
 * error logs.
 */

import { createClient } from "@/lib/supabase/server";
import type { TransportStop } from "@/components/properties/detail/TransportWidget";

const METERS_PER_MILE = 1609.344;
const DEFAULT_RADIUS_METERS = 8000;
const MAX_RESULTS = 6;

type NearbyStopRow = {
  name: string;
  stop_type: string;
  distance_meters: number;
};

const VALID_TYPES: ReadonlySet<TransportStop["type"]> = new Set([
  "rail",
  "tube",
  "tram",
  "ferry",
  "bus",
]);

/** Map a validated RPC row to the widget's TransportStop, or null if malformed. */
export function toTransportStop(row: NearbyStopRow): TransportStop | null {
  const type = row.stop_type as TransportStop["type"];
  if (!row.name || !VALID_TYPES.has(type)) return null;
  const miles = row.distance_meters / METERS_PER_MILE;
  return {
    name: row.name,
    type,
    distance_miles: Math.round(miles * 10) / 10,
  };
}

/**
 * Fetch nearest transport stations for given coordinates. Returns stops sorted
 * nearest-first, or null when there is no data or the query fails.
 */
export async function getNearbyTransport(
  lat: number,
  lng: number,
): Promise<TransportStop[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_nearby_transport_stops", {
      center_lat: lat,
      center_lng: lng,
      radius_meters: DEFAULT_RADIUS_METERS,
      max_results: MAX_RESULTS,
    });

    if (error) {
      console.error("[transport-service] RPC failed", {
        error_type: error.code ?? "unknown",
      });
      return null;
    }

    const rows = (data ?? []) as NearbyStopRow[];
    const stops = rows
      .map(toTransportStop)
      .filter((s): s is TransportStop => s !== null);

    return stops.length > 0 ? stops : null;
  } catch (error) {
    console.error("[transport-service] Lookup failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
