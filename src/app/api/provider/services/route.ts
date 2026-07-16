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

/** GET /api/provider/services — list services for authenticated provider */
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
    .from("provider_services")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** POST /api/provider/services — create a new service */
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
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: "Service name is required." },
      { status: 400 },
    );
  }
  if (!body.category || !VALID_CATEGORIES.has(body.category)) {
    return NextResponse.json(
      { error: "Invalid category." },
      { status: 400 },
    );
  }
  if (!body.pricing_type || !VALID_PRICING_TYPES.has(body.pricing_type as PricingType)) {
    return NextResponse.json(
      { error: "Invalid pricing type." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("provider_services")
    .insert({
      provider_id: providerId,
      name: body.name.trim(),
      category: body.category,
      description: body.description ?? null,
      pricing_type: body.pricing_type as PricingType,
      price_amount: body.price_amount ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
