/**
 * Map domain types for MapLibre GL JS integration, clustering, and drawing.
 */

import type { ListingType, PropertyType } from "./property";

/** Map camera state */
export type MapViewState = Readonly<{
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}>;

/** Geographic bounding box */
export type MapBounds = Readonly<{
  north: number;
  south: number;
  east: number;
  west: number;
}>;

/** Individual property point on the map */
export type PropertyMapPoint = Readonly<{
  id: string;
  lat: number;
  lng: number;
  price: number;
  property_type: PropertyType;
  bedrooms: number;
  listing_type: ListingType;
}>;

/** Clustered group of property points */
export type PropertyCluster = Readonly<{
  cluster_id: number;
  lat: number;
  lng: number;
  point_count: number;
  expansion_zoom: number;
}>;

/** Drawn polygon coordinates (GeoJSON polygon ring) */
export type DrawPolygon = Readonly<{
  coordinates: number[][];
}>;
