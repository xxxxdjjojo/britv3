/**
 * Tests for polygon search functionality:
 * - Polygon coordinate validation
 * - GeoJSON format conversion
 * - Search service polygon routing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// -- Polygon validation helpers -----------------------------------------------

/**
 * Validate polygon coordinates:
 * - Must have at least 4 points (3 vertices + closing point)
 * - First and last points must match (closed ring)
 */
function validatePolygon(coordinates: number[][]): {
  valid: boolean;
  error?: string;
} {
  if (coordinates.length < 4) {
    return {
      valid: false,
      error: "Polygon must have at least 3 points (plus closing point)",
    };
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    return {
      valid: false,
      error: "Polygon must be closed (first and last points must match)",
    };
  }

  return { valid: true };
}

/**
 * Convert polygon coordinates to GeoJSON string for search API.
 */
function polygonToGeoJSON(coordinates: number[][]): string {
  const geojson = {
    type: "Polygon" as const,
    coordinates: [coordinates],
  };
  return JSON.stringify(geojson);
}

describe("polygon validation", () => {
  it("rejects polygon with fewer than 3 points (plus closing)", () => {
    const result = validatePolygon([
      [-0.1, 51.5],
      [-0.2, 51.5],
      [-0.1, 51.5], // only 2 unique vertices + close = 3 total
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 3 points");
  });

  it("accepts polygon with 3+ vertices and closing point", () => {
    const result = validatePolygon([
      [-0.1, 51.5],
      [-0.2, 51.5],
      [-0.15, 51.6],
      [-0.1, 51.5], // closed
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects unclosed polygon", () => {
    const result = validatePolygon([
      [-0.1, 51.5],
      [-0.2, 51.5],
      [-0.15, 51.6],
      [-0.05, 51.55], // not closed
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("closed");
  });
});

describe("polygon to GeoJSON conversion", () => {
  it("produces valid GeoJSON Polygon string", () => {
    const coords = [
      [-0.1, 51.5],
      [-0.2, 51.5],
      [-0.15, 51.6],
      [-0.1, 51.5],
    ];

    const geojsonStr = polygonToGeoJSON(coords);
    const parsed = JSON.parse(geojsonStr);

    expect(parsed.type).toBe("Polygon");
    expect(parsed.coordinates).toHaveLength(1); // one ring
    expect(parsed.coordinates[0]).toEqual(coords);
  });

  it("wraps coordinates in an outer ring array", () => {
    const coords = [
      [-0.1, 51.5],
      [-0.2, 51.5],
      [-0.15, 51.6],
      [-0.1, 51.5],
    ];

    const parsed = JSON.parse(polygonToGeoJSON(coords));

    // GeoJSON Polygon has coordinates as array of rings
    expect(Array.isArray(parsed.coordinates[0])).toBe(true);
    expect(Array.isArray(parsed.coordinates[0][0])).toBe(true);
  });
});

describe("search service polygon routing", () => {
  it("calls polygon RPC when polygon param present", async () => {
    // Mock Supabase
    const mockRpc = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) =>
        resolve({ data: [], error: null, count: 0 }),
      ),
    });

    const supabase = {
      rpc: mockRpc,
      from: vi.fn(),
    };

    // Import query builder
    const { buildSearchQuery } = await import("@/lib/search/query-builder");

    const polygonGeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [-0.1, 51.5],
          [-0.2, 51.5],
          [-0.15, 51.6],
          [-0.1, 51.5],
        ],
      ],
    });

    await buildSearchQuery(supabase as never, {
      polygon: polygonGeoJSON,
    });

    expect(mockRpc).toHaveBeenCalledWith("search_listings_by_polygon", {
      polygon_geojson: polygonGeoJSON,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("prioritizes polygon over radius search when both provided", async () => {
    const mockRpc = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) =>
        resolve({ data: [], error: null, count: 0 }),
      ),
    });

    const supabase = {
      rpc: mockRpc,
      from: vi.fn(),
    };

    const { buildSearchQuery } = await import("@/lib/search/query-builder");

    await buildSearchQuery(supabase as never, {
      polygon: '{"type":"Polygon","coordinates":[[[-0.1,51.5],[-0.2,51.5],[-0.15,51.6],[-0.1,51.5]]]}',
      lat: 51.5,
      lng: -0.1,
      radius: 5,
    });

    // Should call polygon RPC, not radius RPC
    expect(mockRpc).toHaveBeenCalledWith(
      "search_listings_by_polygon",
      expect.any(Object),
    );
    expect(mockRpc).not.toHaveBeenCalledWith(
      "search_listings_by_radius",
      expect.any(Object),
    );
  });
});
