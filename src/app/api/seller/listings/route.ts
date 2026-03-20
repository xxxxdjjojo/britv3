import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSellerListings, createListing } from "@/services/seller/listing-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as import("@/types/seller").ListingStatus | null;

  try {
    const listings = await getSellerListings(supabase, status ?? undefined);
    return NextResponse.json(listings);
  } catch (err) {
    console.error("[api/seller/listings] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const listing = await createListing(supabase, body);
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("[api/seller/listings] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
