import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProviderBySlug } from "@/services/marketplace/provider-service";

/**
 * GET /api/providers/[slug]
 * Public endpoint -- get a provider's public profile by slug.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: "Provider slug is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const provider = await getProviderBySlug(supabase, slug);

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
