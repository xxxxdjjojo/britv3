import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSellerViewings } from "@/services/seller/viewing-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") as "upcoming" | "past" | null;

  try {
    const viewings = await getSellerViewings(supabase, filter ?? undefined);
    return NextResponse.json(viewings);
  } catch (err) {
    console.error("[api/seller/viewings] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
