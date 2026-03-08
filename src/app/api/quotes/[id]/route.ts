import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuote } from "@/services/marketplace/quote-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    const { id } = await params;
    const quote = await getQuote(supabase, id);

    return NextResponse.json({ data: quote });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get quote";
    if (message.includes("not found") || message.includes("PGRST116")) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
