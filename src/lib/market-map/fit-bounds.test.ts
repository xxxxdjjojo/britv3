import { describe, it, expect } from "vitest";
import { fitBoundsFor } from "./fit-bounds";
import type { MarketSearchResult, FitBoundsParams } from "./fit-bounds";

// ---------------------------------------------------------------------------
// fitBoundsFor — converts a geocoder search result into MapLibre fitBounds params
// ---------------------------------------------------------------------------

describe("fitBoundsFor", () => {
  // -------------------------------------------------------------------------
  // bbox → bounds conversion
  // -------------------------------------------------------------------------

  it("converts bbox [w,s,e,n] to bounds [[w,s],[e,n]]", () => {
    const result: MarketSearchResult = {
      id: "manchester",
      name: "Manchester",
      type: "city",
      bbox: [-2.3, 53.3, -2.1, 53.5],
      center: [-2.2, 53.4],
      default_zoom: 11,
    };

    const params = fitBoundsFor(result);
    expect(params.bounds).toEqual([[-2.3, 53.3], [-2.1, 53.5]]);
  });

  it("carries center coordinates unchanged", () => {
    const result: MarketSearchResult = {
      id: "london",
      name: "London",
      type: "city",
      bbox: [-0.5, 51.3, 0.3, 51.7],
      center: [-0.118, 51.509],
      default_zoom: 10,
    };

    const params = fitBoundsFor(result);
    expect(params.center).toEqual([-0.118, 51.509]);
  });

  it("carries default_zoom as zoom", () => {
    const result: MarketSearchResult = {
      id: "area-1",
      name: "Test Area",
      type: "local_authority",
      bbox: [0, 50, 1, 51],
      center: [0.5, 50.5],
      default_zoom: 6,
    };

    const params = fitBoundsFor(result);
    expect(params.zoom).toBe(6);
  });

  // -------------------------------------------------------------------------
  // geographyLevel selection via geographyLevelForZoom
  // -------------------------------------------------------------------------

  it("default_zoom=11 → geographyLevel 'msoa' (10 ≤ zoom < 13)", () => {
    const result: MarketSearchResult = {
      id: "neighbourhood-1",
      name: "Didsbury",
      type: "msoa",
      bbox: [-2.25, 53.4, -2.2, 53.45],
      center: [-2.22, 53.42],
      default_zoom: 11,
    };

    const params: FitBoundsParams = fitBoundsFor(result);
    expect(params.geographyLevel).toBe("msoa");
  });

  it("default_zoom=6 → geographyLevel 'local_authority' (zoom < 7)", () => {
    const result: MarketSearchResult = {
      id: "county-1",
      name: "Greater Manchester",
      type: "local_authority",
      bbox: [-2.7, 53.3, -1.9, 53.7],
      center: [-2.3, 53.5],
      default_zoom: 6,
    };

    const params: FitBoundsParams = fitBoundsFor(result);
    expect(params.geographyLevel).toBe("local_authority");
  });

  it("default_zoom=8 → geographyLevel 'postcode_district' (7 ≤ zoom < 10)", () => {
    const result: MarketSearchResult = {
      id: "district-1",
      name: "M1 area",
      type: "postcode_district",
      bbox: [-2.25, 53.47, -2.2, 53.5],
      center: [-2.23, 53.48],
      default_zoom: 8,
    };

    const params: FitBoundsParams = fitBoundsFor(result);
    expect(params.geographyLevel).toBe("postcode_district");
  });

  it("default_zoom=14 → geographyLevel 'lsoa' (13 ≤ zoom < 16)", () => {
    const result: MarketSearchResult = {
      id: "lsoa-1",
      name: "Local pocket",
      type: "lsoa",
      bbox: [-2.22, 53.41, -2.21, 53.42],
      center: [-2.215, 53.415],
      default_zoom: 14,
    };

    const params: FitBoundsParams = fitBoundsFor(result);
    expect(params.geographyLevel).toBe("lsoa");
  });

  it("default_zoom=17 → geographyLevel 'street' (zoom ≥ 16)", () => {
    const result: MarketSearchResult = {
      id: "street-1",
      name: "Example Street",
      type: "street",
      bbox: [-2.219, 53.413, -2.218, 53.414],
      center: [-2.2185, 53.4135],
      default_zoom: 17,
    };

    const params: FitBoundsParams = fitBoundsFor(result);
    expect(params.geographyLevel).toBe("street");
  });

  // -------------------------------------------------------------------------
  // Full return shape check
  // -------------------------------------------------------------------------

  it("returns a complete FitBoundsParams shape", () => {
    const result: MarketSearchResult = {
      id: "full-test",
      name: "Full Test",
      type: "msoa",
      bbox: [1.1, 52.2, 1.3, 52.4],
      center: [1.2, 52.3],
      default_zoom: 12,
    };

    const params = fitBoundsFor(result);
    expect(params).toMatchObject({
      bounds: [[1.1, 52.2], [1.3, 52.4]],
      center: [1.2, 52.3],
      zoom: 12,
      geographyLevel: "msoa",
    });
  });
});
