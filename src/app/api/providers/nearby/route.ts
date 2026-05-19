/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/providers/nearby?sw_lat=51.4&sw_lng=-0.3&ne_lat=51.6&ne_lng=0.1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const swLat = parseFloat(searchParams.get("sw_lat") ?? "");
    const swLng = parseFloat(searchParams.get("sw_lng") ?? "");
    const neLat = parseFloat(searchParams.get("ne_lat") ?? "");
    const neLng = parseFloat(searchParams.get("ne_lng") ?? "");

    // Validate all params are valid numbers
    if ([swLat, swLng, neLat, neLng].some((v) => Number.isNaN(v))) {
      return NextResponse.json(
        { error: "Missing or invalid bounds parameters (sw_lat, sw_lng, ne_lat, ne_lng)" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Try to query providers whose lat/lng fall within the bounding box.
    // If latitude/longitude columns don't exist on the table, this will
    // throw and we fall through to the catch returning an empty array.
    // TODO: Confirm column names once provider geolocation is added to the schema
    const { data, error } = await supabase
      .from("service_provider_details")
      .select("id, slug, business_name, category, average_rating, latitude, longitude")
      .gte("latitude", swLat)
      .lte("latitude", neLat)
      .gte("longitude", swLng)
      .lte("longitude", neLng)
      .limit(50);

    if (error) {
      // Non-critical — return empty rather than 500
      console.warn("[nearby providers]", error.message);
      return NextResponse.json({ providers: [] });
    }

    const providers = (data ?? []).map((row) => ({
      id: row.id as string,
      slug: (row.slug ?? row.id) as string,
      name: (row.business_name ?? "Unknown") as string,
      category: (row.category ?? "General") as string,
      rating: row.average_rating as number | null,
      lat: row.latitude as number,
      lng: row.longitude as number,
    }));

    return NextResponse.json({ providers });
  } catch (err) {
    console.error("[nearby providers] unexpected error", err);
    return NextResponse.json({ providers: [] });
  }
}
