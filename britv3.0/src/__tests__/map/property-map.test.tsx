/**
 * Tests for PropertyMap component and GeoJSON conversion.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { maplibreMock, reactMaplibreMock } from "../mocks/maplibre";
import { propertiesToGeoJSON } from "@/lib/map/cluster";
import type { PropertyMapPoint } from "@/types/map";

// Mock MapLibre modules
vi.mock("maplibre-gl", () => maplibreMock);
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("@vis.gl/react-maplibre", () => reactMaplibreMock);

describe("propertiesToGeoJSON", () => {
  const sampleProperties: PropertyMapPoint[] = [
    {
      id: "prop-1",
      lat: 51.5074,
      lng: -0.1276,
      price: 500000,
      property_type: "flat",
      bedrooms: 2,
      listing_type: "sale",
    },
    {
      id: "prop-2",
      lat: 51.5155,
      lng: -0.0922,
      price: 1200,
      property_type: "terraced",
      bedrooms: 3,
      listing_type: "rent",
    },
  ];

  it("produces a valid GeoJSON FeatureCollection", () => {
    const geojson = propertiesToGeoJSON(sampleProperties);

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2);
    expect(geojson.features[0].type).toBe("Feature");
    expect(geojson.features[0].geometry.type).toBe("Point");
  });

  it("uses [lng, lat] coordinate order (GeoJSON convention)", () => {
    const geojson = propertiesToGeoJSON(sampleProperties);
    const coords = geojson.features[0].geometry.coordinates;

    // GeoJSON: [longitude, latitude]
    expect(coords[0]).toBe(-0.1276); // longitude first
    expect(coords[1]).toBe(51.5074); // latitude second
  });

  it("includes property metadata in feature properties", () => {
    const geojson = propertiesToGeoJSON(sampleProperties);
    const props = geojson.features[0].properties;

    expect(props).toEqual({
      id: "prop-1",
      price: 500000,
      property_type: "flat",
      bedrooms: 2,
      listing_type: "sale",
    });
  });

  it("handles empty properties array", () => {
    const geojson = propertiesToGeoJSON([]);

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(0);
  });
});

describe("PropertyMap", () => {
  it("renders the mock map container", async () => {
    // Dynamic import to ensure mocks are in place
    const { PropertyMap } = await import("@/components/map/PropertyMap");

    render(
      <PropertyMap
        properties={[
          {
            id: "p1",
            lat: 51.5,
            lng: -0.1,
            price: 300000,
            property_type: "flat",
            bedrooms: 2,
            listing_type: "sale",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("mock-map")).toBeDefined();
  });

  it("renders source and layer elements", async () => {
    const { PropertyMap } = await import("@/components/map/PropertyMap");

    const { container } = render(
      <PropertyMap
        properties={[
          {
            id: "p1",
            lat: 51.5,
            lng: -0.1,
            price: 300000,
            property_type: "flat",
            bedrooms: 2,
            listing_type: "sale",
          },
        ]}
      />,
    );

    expect(container.querySelector("[data-testid='mock-source']")).not.toBeNull();
    expect(container.querySelectorAll("[data-testid='mock-layer']")).toHaveLength(3);
  });
});
