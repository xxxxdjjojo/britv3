/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSellerOffers } from "@/services/seller/offer-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listing_id") ?? undefined;

  try {
    const offers = await getSellerOffers(supabase, listingId);
    return NextResponse.json(offers);
  } catch (err) {
    console.error("[api/seller/offers] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
