import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getListing,
  updateListing,
  deleteListing,
} from "@/services/listings/listing-service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/listings/[id] -- Get a single listing (public for active, owner for any).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const result = await getListing(supabase, id);

    if (!result) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/listings/[id] -- Update a listing (requires auth + ownership).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const result = await updateListing(supabase, user.id, id, body);

    return NextResponse.json({ data: result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/listings/[id] -- Soft delete a listing (requires auth + ownership).
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    await deleteListing(supabase, user.id, id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
