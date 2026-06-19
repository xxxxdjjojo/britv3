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

    // service_provider_details stores location as a PostGIS geography point
    // (base_location), not flat lat/lng columns, so the bbox query must run in
    // the database. providers_in_bounds returns the flat shape we render.
    const { data, error } = await supabase.rpc("providers_in_bounds", {
      sw_lat: swLat,
      sw_lng: swLng,
      ne_lat: neLat,
      ne_lng: neLng,
    });

    if (error) {
      // Non-critical — return empty rather than 500
      console.warn("[nearby providers]", error.message);
      return NextResponse.json({ providers: [] });
    }

    const rows = (data ?? []) as Array<{
      id: string;
      slug: string | null;
      business_name: string | null;
      category: string | null;
      average_rating: number | null;
      lat: number;
      lng: number;
    }>;

    const providers = rows.map((row) => ({
      id: row.id,
      slug: row.slug ?? row.id,
      name: row.business_name ?? "Unknown",
      category: row.category ?? "General",
      rating: row.average_rating,
      lat: row.lat,
      lng: row.lng,
    }));

    return NextResponse.json({ providers });
  } catch (err) {
    console.error("[nearby providers] unexpected error", err);
    return NextResponse.json({ providers: [] });
  }
}
