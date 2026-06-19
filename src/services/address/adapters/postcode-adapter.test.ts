import { describe, it, expect, vi, beforeEach } from "vitest";

// The free `postcode` driver delegates to the existing postcodes.io wrapper.
vi.mock("@/services/search/geocode-service", () => ({
  autocompletePostcode: vi.fn(),
  geocodePostcode: vi.fn(),
}));

import {
  autocompletePostcode,
  geocodePostcode,
} from "@/services/search/geocode-service";
import { PostcodeAddressAdapter } from "./postcode-adapter";

const adapter = new PostcodeAddressAdapter();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PostcodeAddressAdapter", () => {
  it('identifies as "postcode"', () => {
    expect(adapter.name).toBe("postcode");
  });

  it("autocomplete maps postcodes.io results to {postcode,label} suggestions", async () => {
    vi.mocked(autocompletePostcode).mockResolvedValue(["M1 1AE", "M1 1AF"]);

    const out = await adapter.autocomplete("M1 1");

    expect(autocompletePostcode).toHaveBeenCalledWith("M1 1");
    expect(out).toEqual([
      { postcode: "M1 1AE", label: "M1 1AE" },
      { postcode: "M1 1AF", label: "M1 1AF" },
    ]);
  });

  it("autocomplete returns [] for sub-2-char queries without hitting the API", async () => {
    const out = await adapter.autocomplete("M");
    expect(out).toEqual([]);
    expect(autocompletePostcode).not.toHaveBeenCalled();
  });

  it("resolve extracts the postcode from a free-text address then geocodes it", async () => {
    vi.mocked(geocodePostcode).mockResolvedValue({
      lat: 53.47,
      lng: -2.23,
      admin_district: "Manchester",
      region: "North West",
      postcode: "M1 1AE",
    });

    const out = await adapter.resolve("10 Downing Street, M1 1AE");

    expect(geocodePostcode).toHaveBeenCalledWith("M1 1AE");
    expect(out).toEqual({
      postcode: "M1 1AE",
      postcodeDisplay: "M1 1AE",
      lat: 53.47,
      lng: -2.23,
      label: "10 Downing Street, M1 1AE",
    });
  });

  it("resolve returns null (no geocode call) when no postcode can be extracted", async () => {
    const out = await adapter.resolve("just some words");
    expect(out).toBeNull();
    expect(geocodePostcode).not.toHaveBeenCalled();
  });
});
