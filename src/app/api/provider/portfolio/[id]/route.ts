import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/services/provider/provider-portfolio-service";

async function resolveProviderId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return providerProfile?.id ?? userId;
}

/** PATCH /api/provider/portfolio/[id] — update a portfolio item */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const providerId = await resolveProviderId(supabase, user.id);

  let body: {
    title?: string;
    description?: string | null;
    category?: string | null;
    before_image_path?: string | null;
    after_image_path?: string | null;
    is_featured?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const updated = await updatePortfolioItem(supabase, providerId, id, body);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.startsWith("Authorization") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** DELETE /api/provider/portfolio/[id] — delete a portfolio item */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const providerId = await resolveProviderId(supabase, user.id);

  try {
    await deletePortfolioItem(supabase, providerId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.startsWith("Authorization") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
