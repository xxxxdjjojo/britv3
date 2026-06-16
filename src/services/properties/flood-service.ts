/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Flood risk from the Environment Agency "Risk of Flooding from Rivers and Sea"
 * (NaFRA2) dataset, via its WMS GetFeatureInfo endpoint (Open Government Licence
 * v3.0). Returns the flood-risk band for a property's coordinates. Redis-cached
 * 30 days — the dataset only changes on EA refresh.
 *
 * Returns null on any error or unexpected data — callers degrade by absence
 * (never render a placeholder widget). Land with no mapped risk resolves to
 * "Very Low" (matching GOV.UK "Check your long-term flood risk").
 *
 * CRITICAL SECURITY: coordinates are never included in error messages.
 */

import { getCached, setCache } from "@/lib/cache/redis";

const WMS_URL =
  "https://environment.data.gov.uk/spatialdata/nafra2-risk-of-flooding-from-rivers-and-sea/wms";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const FETCH_TIMEOUT_MS = 9000;
/** Half-width of the ~1m query box around the point, in degrees. */
const BBOX_DELTA = 0.00001;

export type FloodRiskLevel = "Very Low" | "Low" | "Medium" | "High";

export type FloodRisk = Readonly<{ riskLevel: FloodRiskLevel }>;

/**
 * Map an EA `risk_band` raw value to a clean band. `null`/`undefined` (no
 * overlapping feature) means no mapped risk -> "Very Low". Any unexpected
 * value -> null (don't guess). Pure — safe to unit test without network.
 */
export function mapRiskBand(raw: string | null | undefined): FloodRiskLevel | null {
  if (raw == null) return "Very Low";
  switch (raw) {
    case "High":
      return "High";
    case "Medium":
      return "Medium";
    case "Low":
      return "Low";
    case "Very low":
      return "Very Low";
    default:
      return null;
  }
}

/**
 * Extract the `risk_band` from an EA GetFeatureInfo GeoJSON response. Returns
 * `null` (the JS value) when there is no overlapping feature, which the mapper
 * resolves to "Very Low". Returns `undefined` only when the shape is invalid.
 */
function extractRiskBand(json: unknown): string | null | undefined {
  if (typeof json !== "object" || json === null) return undefined;
  const features = (json as { features?: unknown }).features;
  if (!Array.isArray(features)) return undefined;
  if (features.length === 0) return null;
  const first = features[0];
  if (typeof first !== "object" || first === null) return undefined;
  const properties = (first as { properties?: unknown }).properties;
  if (typeof properties !== "object" || properties === null) return undefined;
  const band = (properties as { risk_band?: unknown }).risk_band;
  if (typeof band !== "string") return undefined;
  return band;
}

function buildUrl(lat: number, lng: number): string {
  const url = new URL(WMS_URL);
  // CRS:84 keeps the bbox in lon,lat order (avoids the EPSG:4326 axis gotcha).
  const bbox = [
    lng - BBOX_DELTA,
    lat - BBOX_DELTA,
    lng + BBOX_DELTA,
    lat + BBOX_DELTA,
  ].join(",");
  const params = new URLSearchParams({
    service: "WMS",
    version: "1.3.0",
    request: "GetFeatureInfo",
    layers: "rofrs_4band",
    query_layers: "rofrs_4band",
    crs: "CRS:84",
    bbox,
    width: "1",
    height: "1",
    i: "0",
    j: "0",
    feature_count: "1",
    info_format: "application/json",
  });
  url.search = params.toString();
  return url.toString();
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[flood-service] WMS error", { status: res.status });
      return null;
    }
    return (await res.json()) as unknown;
  } catch (error) {
    console.error("[flood-service] fetch failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

export async function getFloodRisk(
  lat: number,
  lng: number,
): Promise<FloodRisk | null> {
  const cacheKey = `flood:lat:${lat.toFixed(3)}:lng:${lng.toFixed(3)}`;
  const cached = await getCached<FloodRisk>(cacheKey);
  if (cached) return cached;

  const json = await fetchJson(buildUrl(lat, lng));
  if (json === null) return null;

  const band = extractRiskBand(json);
  if (band === undefined) {
    console.error("[flood-service] unexpected WMS response shape");
    return null;
  }

  const riskLevel = mapRiskBand(band);
  if (riskLevel === null) {
    console.error("[flood-service] unexpected risk_band", { band });
    return null;
  }

  const result: FloodRisk = { riskLevel };
  await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}
