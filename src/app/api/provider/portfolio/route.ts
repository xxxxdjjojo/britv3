import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import {
  getPortfolioItems,
  addPortfolioItem,
} from "@/services/provider/provider-portfolio-service";

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

async function resolveProviderId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return providerProfile?.id ?? userId;
}

/** GET /api/provider/portfolio — list portfolio items for authenticated provider */
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

  const providerId = await resolveProviderId(supabase, user.id);

  try {
    const items = await getPortfolioItems(supabase, providerId);
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/provider/portfolio — add a portfolio item */
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

  const providerId = await resolveProviderId(supabase, user.id);

  let body: {
    title?: string;
    description?: string;
    category?: string;
    before_image_path?: string;
    after_image_path?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (body.category && !VALID_CATEGORIES.has(body.category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  try {
    const item = await addPortfolioItem(supabase, providerId, {
      title: body.title.trim(),
      description: body.description,
      category: body.category,
      before_image_path: body.before_image_path,
      after_image_path: body.after_image_path,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
