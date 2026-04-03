import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiDatabaseError,
} from "@/lib/api-response";

/** GET /api/provider/service-areas — fetch all service areas for authenticated provider */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiUnauthorized();
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  const { data, error } = await supabase
    .from("provider_service_areas")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: true });

  if (error) {
    return apiDatabaseError(error, "api/provider/service-areas");
  }

  return apiSuccess(data ?? []);
}

/** POST /api/provider/service-areas — create a new service area zone */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiUnauthorized();
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  let body: {
    name?: string | null;
    zone: unknown;
    radius_km?: number | null;
    zone_type: string;
    is_primary?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiValidationError({ body: "Invalid JSON" });
  }

  // Validate
  if (!body.zone) {
    return apiValidationError({ zone: "GeoJSON geometry is required" });
  }

  if (!["radius", "polygon"].includes(body.zone_type)) {
    return apiValidationError({ zone_type: "Must be 'radius' or 'polygon'" });
  }

  // Basic GeoJSON structure check
  const geo = body.zone as { type?: string; coordinates?: unknown[] };
  if (!geo.type || !geo.coordinates) {
    return apiValidationError({ zone: "Must be a valid GeoJSON geometry" });
  }

  // The DB column is geometry(MultiPolygon, 4326) — terra-draw emits Polygon
  // geometry, so wrap it when needed.
  const zoneGeometry =
    geo.type === "Polygon"
      ? { type: "MultiPolygon" as const, coordinates: [geo.coordinates] }
      : geo;

  const { data, error } = await supabase
    .from("provider_service_areas")
    .insert({
      provider_id: providerId,
      name: body.name ?? null,
      zone: zoneGeometry,
      radius_km: body.radius_km ?? null,
      zone_type: body.zone_type as "radius" | "polygon",
      is_primary: body.is_primary ?? false,
    })
    .select()
    .single();

  if (error) {
    return apiDatabaseError(error, "api/provider/service-areas");
  }

  return apiSuccess(data, 201);
}

/** DELETE /api/provider/service-areas?id=<id> — delete a zone */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return apiValidationError({ id: "Query param required" });
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  const { error } = await supabase
    .from("provider_service_areas")
    .delete()
    .eq("id", id)
    .eq("provider_id", providerId); // ownership guard

  if (error) {
    return apiDatabaseError(error, "api/provider/service-areas");
  }

  return new NextResponse(null, { status: 204 });
}
