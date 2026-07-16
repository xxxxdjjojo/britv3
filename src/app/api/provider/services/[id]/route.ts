import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import type { PricingType } from "@/types/provider-dashboard";

const VALID_CATEGORIES = new Set([
  "plumbing",
  "electrical",
  "gas",
  "carpentry",
  "plastering",
  "painting",
  "roofing",
  "flooring",
  "landscaping",
  "general_maintenance",
  "cleaning",
  "moving",
  "conveyancing",
  "surveying",
  "mortgage_advice",
]);

const VALID_PRICING_TYPES = new Set<PricingType>([
  "hourly",
  "fixed",
  "quote_on_request",
]);

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/provider/services/[id] — update a service */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id } = await context.params;
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
    name?: string;
    category?: string;
    description?: string | null;
    pricing_type?: string;
    price_amount?: number | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate
  if (body.name !== undefined && !body.name.trim()) {
    return NextResponse.json(
      { error: "Service name cannot be empty." },
      { status: 400 },
    );
  }
  if (body.category !== undefined && !VALID_CATEGORIES.has(body.category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (
    body.pricing_type !== undefined &&
    !VALID_PRICING_TYPES.has(body.pricing_type as PricingType)
  ) {
    return NextResponse.json(
      { error: "Invalid pricing type." },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.category !== undefined) updates.category = body.category;
  if (body.description !== undefined) updates.description = body.description;
  if (body.pricing_type !== undefined) updates.pricing_type = body.pricing_type;
  if (body.price_amount !== undefined) updates.price_amount = body.price_amount;

  const { data, error } = await supabase
    .from("provider_services")
    .update(updates)
    .eq("id", id)
    .eq("provider_id", providerId) // ownership guard
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** DELETE /api/provider/services/[id] — delete a service */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id } = await context.params;
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

  const { error } = await supabase
    .from("provider_services")
    .delete()
    .eq("id", id)
    .eq("provider_id", providerId); // ownership guard

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
