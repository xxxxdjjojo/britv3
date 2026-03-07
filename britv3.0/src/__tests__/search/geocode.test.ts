import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPostcodesMock } from "../mocks/postcodes-io";

import {
  geocodePostcode,
  autocompletePostcode,
  reverseGeocode,
} from "@/services/search/geocode-service";

describe("geocode-service", () => {
  let mockFetchCleanup: { restore: () => void };

  beforeEach(() => {
    mockFetchCleanup = setupPostcodesMock();
  });

  afterEach(() => {
    mockFetchCleanup.restore();
  });

  describe("geocodePostcode", () => {
    it("resolves a valid UK postcode to lat/lng and region data", async () => {
      const result = await geocodePostcode("SW1A 1AA");
      expect(result).toEqual({
        lat: 51.5014,
        lng: -0.1419,
        admin_district: "Westminster",
        region: "London",
        postcode: "SW1A 1AA",
      });
    });

    it("returns null for an invalid postcode", async () => {
      const result = await geocodePostcode("INVALID");
      expect(result).toBeNull();
    });

    it("handles postcodes with varying whitespace", async () => {
      const result = await geocodePostcode("  sw1a  1aa  ");
      expect(result).not.toBeNull();
      expect(result?.postcode).toBe("SW1A 1AA");
    });
  });

  describe("autocompletePostcode", () => {
    it("returns matching postcodes for a partial input", async () => {
      const results = await autocompletePostcode("SW1A");
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain("SW1A 1AA");
    });

    it("returns empty array when no match", async () => {
      const results = await autocompletePostcode("ZZ99");
      expect(results).toEqual([]);
    });
  });

  describe("reverseGeocode", () => {
    it("returns nearest postcode for a lat/lng", async () => {
      const result = await reverseGeocode(51.501, -0.141);
      expect(result).not.toBeNull();
      expect(result?.postcode).toBe("SW1A 1AA");
      expect(result?.lat).toBeDefined();
      expect(result?.lng).toBeDefined();
    });
  });
});
