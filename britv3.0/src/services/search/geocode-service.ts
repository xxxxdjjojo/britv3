/**
 * Geocoding service wrapping postcodes.io REST API.
 * Free UK postcode lookup, autocomplete, and reverse geocoding.
 * No authentication required.
 */

import type { GeocodedLocation } from "@/types/search";

const POSTCODES_API = "https://api.postcodes.io";

/**
 * Normalize a postcode string: uppercase, collapse whitespace.
 */
function normalizePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * Lookup a UK postcode and return geocoded location data.
 * Returns null if the postcode is invalid or not found.
 */
export async function geocodePostcode(
  postcode: string,
): Promise<GeocodedLocation | null> {
  const normalized = normalizePostcode(postcode);
  const encoded = encodeURIComponent(normalized);

  try {
    const response = await fetch(`${POSTCODES_API}/postcodes/${encoded}`);

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    if (json.status !== 200 || !json.result) {
      return null;
    }

    const { latitude, longitude, admin_district, region, postcode: pc } = json.result;

    return {
      lat: latitude,
      lng: longitude,
      admin_district: admin_district ?? "",
      region: region ?? "",
      postcode: pc,
    };
  } catch {
    return null;
  }
}

/**
 * Autocomplete a partial postcode.
 * Returns an array of matching full postcodes.
 */
export async function autocompletePostcode(
  partial: string,
): Promise<string[]> {
  const normalized = normalizePostcode(partial);
  const encoded = encodeURIComponent(normalized);

  try {
    const response = await fetch(
      `${POSTCODES_API}/postcodes/${encoded}/autocomplete`,
    );

    if (!response.ok) {
      return [];
    }

    const json = await response.json();

    if (json.status !== 200 || !json.result) {
      return [];
    }

    return json.result as string[];
  } catch {
    return [];
  }
}

/**
 * Reverse geocode a lat/lng coordinate to the nearest postcode.
 * Returns null if no postcode found nearby.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodedLocation | null> {
  try {
    const response = await fetch(
      `${POSTCODES_API}/postcodes?lon=${lng}&lat=${lat}`,
    );

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    if (json.status !== 200 || !json.result || json.result.length === 0) {
      return null;
    }

    const nearest = json.result[0];

    return {
      lat: nearest.latitude,
      lng: nearest.longitude,
      admin_district: nearest.admin_district ?? "",
      region: nearest.region ?? "",
      postcode: nearest.postcode,
    };
  } catch {
    return null;
  }
}
