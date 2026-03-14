import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAgentListing } from "@/services/agent/agent-listings-service";

/**
 * POST /api/agent/listings
 * Create a new listing. Accepts multipart/form-data with a `data` JSON field
 * and optional `photos` / `floorplan` file fields.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let listingData: Record<string, unknown>;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const raw = formData.get("data");
      if (!raw || typeof raw !== "string") {
        return NextResponse.json({ error: "Missing data field" }, { status: 400 });
      }
      listingData = JSON.parse(raw) as Record<string, unknown>;
      // Photo and floorplan uploads would be handled by Supabase Storage here
      // For now we persist listing metadata only
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
  } else {
    try {
      listingData = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  try {
    const created = await createAgentListing(supabase, user.id, listingData);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/agent/listings
 * Returns the authenticated agent's listings with optional status filter.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const { getAgentListings } = await import("@/services/agent/agent-listings-service");

  try {
    const result = await getAgentListings(supabase, user.id, status, cursor, limit);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch listings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
