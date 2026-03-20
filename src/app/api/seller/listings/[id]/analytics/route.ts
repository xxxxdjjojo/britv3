import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getListingAnalyticsSummary } from "@/services/seller/analytics-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: listing } = await supabase
    .from("seller_listings")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);
  const validDays = [7, 30, 90].includes(days) ? days : 30;

  try {
    const summary = await getListingAnalyticsSummary(supabase, id, validDays);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[api/seller/listings/id/analytics] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
