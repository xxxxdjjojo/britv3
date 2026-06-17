/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerListings, createListing } from "@/services/seller/listing-service";

// Mirrors the createListing() input shape; rejects unexpected columns so
// arbitrary user JSON can't be spread into the Supabase insert.
const createListingSchema = z
  .object({
    postcode: z.string().min(1).max(10),
    address_line_1: z.string().min(1).max(200),
    address_line_2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    property_type: z.string().min(1).max(50),
    tenure: z.string().min(1).max(50),
    leasehold_years_remaining: z.number().int().min(0).max(9999).optional(),
  })
  .strict();

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const listing = await createListing(supabase, parsed.data);
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("[api/seller/listings] error:", err);
    if (err instanceof Error && err.message.includes("already have an active listing")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
