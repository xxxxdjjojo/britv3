/**
 * Mock for postcodes.io API responses.
 * Provides known UK postcode geocode data and autocomplete responses.
 */

import { vi } from "vitest";

const KNOWN_POSTCODES: Record<string, {
  latitude: number;
  longitude: number;
  admin_district: string;
  region: string;
}> = {
  "SW1A 1AA": {
    latitude: 51.5014,
    longitude: -0.1419,
    admin_district: "Westminster",
    region: "London",
  },
  "E1 6AN": {
    latitude: 51.5155,
    longitude: -0.0723,
    admin_district: "Tower Hamlets",
    region: "London",
  },
  "M1 1AE": {
    latitude: 53.4808,
    longitude: -2.2426,
    admin_district: "Manchester",
    region: "North West",
  },
  "B1 1BB": {
    latitude: 52.4862,
    longitude: -1.8904,
    admin_district: "Birmingham",
    region: "West Midlands",
  },
  "LS1 1UR": {
    latitude: 53.7997,
    longitude: -1.5491,
    admin_district: "Leeds",
    region: "Yorkshire and The Humber",
  },
};

/** Returns mock postcodes.io response for a given postcode */
export function mockPostcodeResponse(postcode: string) {
  const normalized = postcode.toUpperCase().replace(/\s+/g, " ").trim();
  const data = KNOWN_POSTCODES[normalized];

  if (!data) {
    return {
      status: 404,
      error: "Postcode not found",
    };
  }

  return {
    status: 200,
    result: {
      postcode: normalized,
      quality: 1,
      eastings: 529090,
      northings: 179645,
      country: "England",
      nhs_ha: "London",
      ...data,
      parliamentary_constituency: "Cities of London and Westminster",
      european_electoral_region: "London",
      primary_care_trust: "Westminster",
      lsoa: "Westminster 023D",
      msoa: "Westminster 023",
      incode: normalized.split(" ")[1] ?? "",
      outcode: normalized.split(" ")[0] ?? "",
    },
  };
}

/** Returns mock autocomplete response for partial postcode */
export function mockAutocompleteResponse(partial: string) {
  const normalized = partial.toUpperCase().trim();
  const matches = Object.keys(KNOWN_POSTCODES).filter((pc) =>
    pc.startsWith(normalized),
  );

  return {
    status: 200,
    result: matches.length > 0 ? matches : null,
  };
}

/** Sets up fetch mock to intercept postcodes.io API calls */
export function setupPostcodesMock() {
  const originalFetch = globalThis.fetch;
  const mockFetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();

    // Postcode lookup: GET /postcodes/{postcode}
    const lookupMatch = url.match(/api\.postcodes\.io\/postcodes\/([^/?]+)$/);
    if (lookupMatch) {
      const postcode = decodeURIComponent(lookupMatch[1]);
      const response = mockPostcodeResponse(postcode);
      return new Response(JSON.stringify(response), {
        status: response.status === 200 ? 200 : 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Autocomplete: GET /postcodes/{partial}/autocomplete
    const autocompleteMatch = url.match(
      /api\.postcodes\.io\/postcodes\/([^/]+)\/autocomplete/,
    );
    if (autocompleteMatch) {
      const partial = decodeURIComponent(autocompleteMatch[1]);
      const response = mockAutocompleteResponse(partial);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Reverse geocode: GET /postcodes?lon=X&lat=Y
    if (url.includes("api.postcodes.io/postcodes?")) {
      return new Response(
        JSON.stringify({
          status: 200,
          result: [
            {
              postcode: "SW1A 1AA",
              ...KNOWN_POSTCODES["SW1A 1AA"],
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Fall through to original fetch for non-postcodes.io requests
    return originalFetch(input);
  });

  globalThis.fetch = mockFetch;

  return {
    mockFetch,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
