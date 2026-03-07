import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  geocodePostcode,
  geocodePostcodes,
  validatePostcode,
} from "./postcodes-io";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

describe("geocodePostcode", () => {
  it("returns correct data for a valid postcode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        result: {
          postcode: "SW1A 1AA",
          latitude: 51.501009,
          longitude: -0.141588,
          admin_district: "Westminster",
          region: "London",
        },
      }),
    });

    const result = await geocodePostcode("SW1A 1AA");

    expect(result).toEqual({
      postcode: "SW1A 1AA",
      latitude: 51.501009,
      longitude: -0.141588,
      admin_district: "Westminster",
      region: "London",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.postcodes.io/postcodes/SW1A%201AA"
    );
  });

  it("returns null for an invalid postcode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 404, error: "Postcode not found" }),
    });

    const result = await geocodePostcode("INVALID");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await geocodePostcode("SW1A 1AA");
    expect(result).toBeNull();
  });
});

describe("geocodePostcodes", () => {
  it("returns a map of postcode results for bulk request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        result: [
          {
            query: "SW1A 1AA",
            result: {
              postcode: "SW1A 1AA",
              latitude: 51.501009,
              longitude: -0.141588,
              admin_district: "Westminster",
              region: "London",
            },
          },
          {
            query: "INVALID",
            result: null,
          },
          {
            query: "EC1A 1BB",
            result: {
              postcode: "EC1A 1BB",
              latitude: 51.520052,
              longitude: -0.09767,
              admin_district: "Islington",
              region: "London",
            },
          },
        ],
      }),
    });

    const results = await geocodePostcodes(["SW1A 1AA", "INVALID", "EC1A 1BB"]);

    expect(results.size).toBe(2);
    expect(results.get("SW1A 1AA")?.latitude).toBe(51.501009);
    expect(results.get("EC1A 1BB")?.admin_district).toBe("Islington");
    expect(results.has("INVALID")).toBe(false);
  });

  it("returns empty map for empty input", async () => {
    const results = await geocodePostcodes([]);
    expect(results.size).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty map on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const results = await geocodePostcodes(["SW1A 1AA"]);
    expect(results.size).toBe(0);
  });
});

describe("validatePostcode", () => {
  it("returns true for a valid postcode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 200, result: true }),
    });

    const result = await validatePostcode("SW1A 1AA");
    expect(result).toBe(true);
  });

  it("returns false for an invalid postcode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 200, result: false }),
    });

    const result = await validatePostcode("INVALID");
    expect(result).toBe(false);
  });

  it("returns false on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await validatePostcode("SW1A 1AA");
    expect(result).toBe(false);
  });
});
