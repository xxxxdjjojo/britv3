import { describe, it, expect, afterEach, vi } from "vitest";
import { getAddressProvider, resetAddressProvider } from "./address-service";

// The postcode driver pulls in geocode-service; stub it so the factory test
// never makes a real network call.
vi.mock("@/services/search/geocode-service", () => ({
  autocompletePostcode: vi.fn().mockResolvedValue([]),
  geocodePostcode: vi.fn().mockResolvedValue(null),
}));

afterEach(() => {
  delete process.env.ADDRESS_PROVIDER;
  resetAddressProvider();
});

describe("getAddressProvider", () => {
  it("defaults to the free postcode driver", () => {
    resetAddressProvider();
    expect(getAddressProvider().name).toBe("postcode");
  });

  it("selects the os_places stub when ADDRESS_PROVIDER=os_places", () => {
    process.env.ADDRESS_PROVIDER = "os_places";
    resetAddressProvider();
    expect(getAddressProvider().name).toBe("os_places");
  });

  it("the os_places stub throws 'not configured' on every method (no real PAF call)", async () => {
    process.env.ADDRESS_PROVIDER = "os_places";
    resetAddressProvider();
    const provider = getAddressProvider();
    await expect(provider.autocomplete("M1 1")).rejects.toThrow(/not configured/i);
    await expect(provider.resolve("M1 1AE")).rejects.toThrow(/not configured/i);
  });

  it("returns a stable singleton until reset", () => {
    resetAddressProvider();
    expect(getAddressProvider()).toBe(getAddressProvider());
  });
});
