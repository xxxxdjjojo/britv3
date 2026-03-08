/**
 * Cluster utilities for converting properties to GeoJSON for MapLibre native clustering.
 */

import type { FeatureCollection, Point } from "geojson";
import type { PropertyMapPoint } from "@/types/map";

/** Maximum zoom level at which clusters are generated */
export const CLUSTER_MAX_ZOOM = 14;

/** Radius of each cluster in pixels */
export const CLUSTER_RADIUS = 60;

/**
 * Convert an array of property map points to a GeoJSON FeatureCollection.
 * Coordinates are in [lng, lat] order (GeoJSON convention).
 */
export function propertiesToGeoJSON(
  properties: PropertyMapPoint[],
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: properties.map((p) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [p.lng, p.lat], // GeoJSON: [longitude, latitude]
      },
      properties: {
        id: p.id,
        price: p.price,
        property_type: p.property_type,
        bedrooms: p.bedrooms,
        listing_type: p.listing_type,
      },
    })),
  };
}
