import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createListing, getMyListings } from "@/services/listings/listing-service";

/**
 * GET /api/listings -- Get current user's listings (requires auth).
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "20");

    const result = await getMyListings(supabase, user.id, {
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get listings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/listings -- Create a new listing (requires auth).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = await createListing(supabase, user.id, body);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
