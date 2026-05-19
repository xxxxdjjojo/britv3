/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getListingById,
  updateListing,
  publishListing,
  archiveListing,
} from "@/services/seller/listing-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await getListingById(supabase, id);
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, ...patch } = body;

  // Photo count validation for Step 3
  if (patch.photos && Array.isArray(patch.photos) && patch.photos.length > 30) {
    return NextResponse.json({ error: "Maximum 30 photos allowed" }, { status: 400 });
  }

  try {
    if (action === "publish") {
      const listing = await publishListing(supabase, id);
      return NextResponse.json(listing);
    }
    if (action === "archive") {
      await archiveListing(supabase, id);
      return NextResponse.json({ success: true });
    }
    const listing = await updateListing(supabase, id, patch);
    return NextResponse.json(listing);
  } catch (err) {
    console.error("[api/seller/listings/id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
