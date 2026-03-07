import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { providerSearchSchema } from "@/lib/validators/marketplace-schemas";
import { searchProviders } from "@/services/marketplace/provider-service";

/**
 * GET /api/providers/search
 * Public endpoint -- search for verified service providers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse query params with type coercion
    const rawParams: Record<string, unknown> = {};

    const category = searchParams.get("service_category");
    if (category) rawParams.service_category = category;

    const postcode = searchParams.get("postcode");
    if (postcode) rawParams.postcode = postcode;

    const radius = searchParams.get("radius");
    if (radius) rawParams.radius = Number(radius);

    const minRating = searchParams.get("min_rating");
    if (minRating) rawParams.min_rating = Number(minRating);

    const searchQuery = searchParams.get("search_query");
    if (searchQuery) rawParams.search_query = searchQuery;

    // Validate
    const parseResult = providerSearchSchema.safeParse(rawParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const result = await searchProviders(supabase, parseResult.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
