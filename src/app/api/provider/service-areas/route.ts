import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";

/** GET /api/provider/service-areas — fetch all service areas for authenticated provider */
export async function GET() {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/** POST /api/provider/service-areas — create a new service area zone */
export async function POST(request: NextRequest) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate
  if (!body.zone) {
    return NextResponse.json(
      { error: "zone (GeoJSON geometry) is required." },
      { status: 400 },
    );
  }

  if (!["radius", "polygon"].includes(body.zone_type)) {
    return NextResponse.json(
      { error: "zone_type must be 'radius' or 'polygon'." },
      { status: 400 },
    );
  }

  // Basic GeoJSON structure check
  const geo = body.zone as { type?: string; coordinates?: unknown };
  if (!geo.type || !geo.coordinates) {
    return NextResponse.json(
      { error: "zone must be a valid GeoJSON geometry." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("provider_service_areas")
    .insert({
      provider_id: providerId,
      name: body.name ?? null,
      zone: body.zone,
      radius_km: body.radius_km ?? null,
      zone_type: body.zone_type as "radius" | "polygon",
      is_primary: body.is_primary ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/** DELETE /api/provider/service-areas?id=<id> — delete a zone */
export async function DELETE(request: NextRequest) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
