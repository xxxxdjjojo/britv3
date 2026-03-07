/**
 * Tests for cluster utility functions and configuration.
 */

import { describe, it, expect } from "vitest";
import {
  propertiesToGeoJSON,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
} from "@/lib/map/cluster";
import type { PropertyMapPoint } from "@/types/map";

describe("cluster configuration", () => {
  it("has CLUSTER_MAX_ZOOM set to 14", () => {
    expect(CLUSTER_MAX_ZOOM).toBe(14);
  });

  it("has CLUSTER_RADIUS set to 60", () => {
    expect(CLUSTER_RADIUS).toBe(60);
  });
});

describe("propertiesToGeoJSON", () => {
  it("returns valid GeoJSON FeatureCollection structure", () => {
    const properties: PropertyMapPoint[] = [
      {
        id: "a",
        lat: 51.5,
        lng: -0.12,
        price: 250000,
        property_type: "detached",
        bedrooms: 4,
        listing_type: "sale",
      },
    ];

    const result = propertiesToGeoJSON(properties);

    expect(result).toMatchObject({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [-0.12, 51.5],
          },
          properties: {
            id: "a",
            price: 250000,
            property_type: "detached",
            bedrooms: 4,
            listing_type: "sale",
          },
        },
      ],
    });
  });

  it("preserves all properties for multiple points", () => {
    const properties: PropertyMapPoint[] = Array.from({ length: 50 }, (_, i) => ({
      id: `prop-${i}`,
      lat: 51 + i * 0.01,
      lng: -0.1 + i * 0.01,
      price: 200000 + i * 10000,
      property_type: "flat" as const,
      bedrooms: 1 + (i % 4),
      listing_type: "sale" as const,
    }));

    const result = propertiesToGeoJSON(properties);

    expect(result.features).toHaveLength(50);
    expect(result.features[49].properties?.id).toBe("prop-49");
  });

  it("coordinates are in [lng, lat] order, not [lat, lng]", () => {
    const properties: PropertyMapPoint[] = [
      {
        id: "coord-test",
        lat: 55.0, // latitude
        lng: -3.0, // longitude
        price: 100000,
        property_type: "terraced",
        bedrooms: 2,
        listing_type: "rent",
      },
    ];

    const result = propertiesToGeoJSON(properties);
    const coords = result.features[0].geometry.coordinates;

    // First element should be longitude (-3.0), NOT latitude (55.0)
    expect(coords[0]).toBe(-3.0);
    expect(coords[1]).toBe(55.0);
  });
});
