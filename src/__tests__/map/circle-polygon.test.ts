import { describe, it, expect } from "vitest";
import { circlePolygon } from "@/lib/map/circle-polygon";

describe("circlePolygon", () => {
  const lng = -0.1276;
  const lat = 51.5074;
  const radius = 1000;

  it("returns a Feature with Polygon geometry", () => {
    const result = circlePolygon(lng, lat, radius);
    expect(result.type).toBe("Feature");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("the ring has 65 points (64 + closed)", () => {
    const result = circlePolygon(lng, lat, radius);
    expect(result.geometry.coordinates[0]).toHaveLength(65);
  });

  it("first and last coordinate are equal (closed ring)", () => {
    const result = circlePolygon(lng, lat, radius);
    const ring = result.geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("centroid is approximately at the input coordinate (within 0.001°)", () => {
    const result = circlePolygon(lng, lat, radius);
    const ring = result.geometry.coordinates[0].slice(0, -1); // exclude closing point
    const avgLng = ring.reduce((sum, c) => sum + c[0], 0) / ring.length;
    const avgLat = ring.reduce((sum, c) => sum + c[1], 0) / ring.length;
    expect(Math.abs(avgLng - lng)).toBeLessThan(0.001);
    expect(Math.abs(avgLat - lat)).toBeLessThan(0.001);
  });

  it("a radius of 1000m produces points spanning at least 0.015° in longitude", () => {
    const result = circlePolygon(lng, lat, radius);
    const ring = result.geometry.coordinates[0];
    const lngs = ring.map((c) => c[0]);
    const span = Math.max(...lngs) - Math.min(...lngs);
    expect(span).toBeGreaterThan(0.015);
  });
});
