/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDescription, getAttemptCount } from "@/services/seller/ai-description-service";
import { getListingById } from "@/services/seller/listing-service";
import type { DescriptionTone } from "@/types/seller";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id, tone } = await request.json() as {
    listing_id: string;
    tone: DescriptionTone;
  };

  if (!listing_id || !tone) {
    return NextResponse.json({ error: "listing_id and tone are required" }, { status: 400 });
  }

  // Verify ownership via RLS (getListingById uses authenticated client)
  const listing = await getListingById(supabase, listing_id);
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const count = await getAttemptCount(supabase, listing_id);
  if (count >= 3) {
    return NextResponse.json(
      { error: "Maximum 3 AI descriptions reached for this listing", attempts_used: count },
      { status: 429 },
    );
  }

  try {
    const description = await generateDescription(supabase, listing, tone);
    const remaining = 2 - count; // count was before this generation
    return NextResponse.json({ description, attempts_remaining: remaining });
  } catch (err) {
    console.error("[api/seller/describe] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET: check how many attempts remain */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const listing_id = searchParams.get("listing_id");
  if (!listing_id) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

  const count = await getAttemptCount(supabase, listing_id);
  return NextResponse.json({ attempts_used: count, attempts_remaining: Math.max(0, 3 - count) });
}
