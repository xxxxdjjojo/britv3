const BASE_URL = "https://api.postcodes.io";

export type PostcodeResult = Readonly<{
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string | null;
  region: string | null;
}>;

/**
 * Geocode a single UK postcode via postcodes.io API.
 * Returns null for invalid postcodes or network errors.
 */
export async function geocodePostcode(
  postcode: string
): Promise<PostcodeResult | null> {
  try {
    const encoded = encodeURIComponent(postcode.trim());
    const response = await fetch(`${BASE_URL}/postcodes/${encoded}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 200 || !data.result) {
      return null;
    }

    const { result } = data;
    return {
      postcode: result.postcode,
      latitude: result.latitude,
      longitude: result.longitude,
      admin_district: result.admin_district ?? null,
      region: result.region ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Bulk geocode UK postcodes (max 100 per request).
 * Returns a Map of postcode -> result. Invalid postcodes are omitted.
 */
export async function geocodePostcodes(
  postcodes: string[]
): Promise<Map<string, PostcodeResult>> {
  const results = new Map<string, PostcodeResult>();

  if (postcodes.length === 0) {
    return results;
  }

  const trimmed = postcodes.map((p) => p.trim());

  try {
    const response = await fetch(`${BASE_URL}/postcodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: trimmed }),
    });

    if (!response.ok) {
      return results;
    }

    const data = await response.json();

    if (data.status !== 200 || !Array.isArray(data.result)) {
      return results;
    }

    for (const entry of data.result) {
      if (entry.result) {
        const { result } = entry;
        results.set(result.postcode, {
          postcode: result.postcode,
          latitude: result.latitude,
          longitude: result.longitude,
          admin_district: result.admin_district ?? null,
          region: result.region ?? null,
        });
      }
    }

    return results;
  } catch {
    return results;
  }
}

/**
 * Validate whether a string is a valid UK postcode.
 */
export async function validatePostcode(postcode: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(postcode.trim());
    const response = await fetch(
      `${BASE_URL}/postcodes/${encoded}/validate`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 200 && data.result === true;
  } catch {
    return false;
  }
}
