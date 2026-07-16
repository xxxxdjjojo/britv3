import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import { reorderPortfolioItems } from "@/services/provider/provider-portfolio-service";

async function resolveProviderId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return providerProfile?.id ?? userId;
}

/** PATCH /api/provider/portfolio/reorder — persist drag-and-drop order */
export async function PATCH(request: NextRequest) {
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

  let body: { orderedIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !Array.isArray(body.orderedIds) ||
    body.orderedIds.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json(
      { error: "orderedIds must be an array of strings." },
      { status: 400 },
    );
  }

  try {
    await reorderPortfolioItems(supabase, providerId, body.orderedIds as string[]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
