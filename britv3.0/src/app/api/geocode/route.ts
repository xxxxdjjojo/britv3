/**
 * GET /api/geocode - Proxy to postcodes.io for UK postcode geocoding.
 * Supports lookup, autocomplete, and reverse geocoding.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  geocodePostcode,
  autocompletePostcode,
  reverseGeocode,
} from "@/services/search/geocode-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q");
    const type = searchParams.get("type") ?? "lookup";

    if (type === "reverse") {
      const lat = parseFloat(searchParams.get("lat") ?? "");
      const lng = parseFloat(searchParams.get("lng") ?? "");

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: "lat and lng are required for reverse geocoding" },
          { status: 400 },
        );
      }

      const result = await reverseGeocode(lat, lng);

      const response = NextResponse.json({ data: result });
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=86400",
      );
      return response;
    }

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: "q parameter is required" },
        { status: 400 },
      );
    }

    if (type === "autocomplete") {
      const results = await autocompletePostcode(q);
      const response = NextResponse.json({ data: results });
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=86400",
      );
      return response;
    }

    // Default: lookup
    const result = await geocodePostcode(q);
    const response = NextResponse.json({ data: result });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=86400",
    );
    return response;
  } catch (error) {
    console.error("[geocode] API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
