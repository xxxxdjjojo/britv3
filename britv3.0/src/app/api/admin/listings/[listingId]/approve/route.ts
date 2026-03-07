import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .update({ status: "active" })
    .eq("id", listingId);

  if (error) {
    return NextResponse.json({ error: "Failed to approve listing" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
