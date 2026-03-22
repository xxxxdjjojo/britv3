import { NextRequest, NextResponse } from "next/server";
import {
  validatePostcodeDistrict,
  normalizePostcodeDistrict,
} from "@/lib/validators/uk";

export async function POST(request: NextRequest) {
  try {
    const { postcode } = await request.json();

    if (!postcode || typeof postcode !== "string") {
      return NextResponse.json(
        { error: "Postcode is required" },
        { status: 400 },
      );
    }

    const district = normalizePostcodeDistrict(postcode);

    if (!validatePostcodeDistrict(district)) {
      return NextResponse.json(
        { error: "Invalid UK postcode district format" },
        { status: 400 },
      );
    }

    // Call postcodes.io (free, no API key needed)
    const response = await fetch(
      `https://api.postcodes.io/outcodes/${encodeURIComponent(district)}`,
      { next: { revalidate: 86400 } },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Postcode district "${district}" not found` },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Postcode lookup service unavailable" },
        { status: 503 },
      );
    }

    const data = await response.json();
    const result = data.result;

    return NextResponse.json({
      district: result.outcode || district,
      area: result.admin_district?.[0] || result.admin_county?.[0] || "",
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country?.[0] || "England",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to look up postcode" },
      { status: 500 },
    );
  }
}
