import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptQuote } from "@/services/marketplace/quote-service";

export async function POST(
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
    const quote = await acceptQuote(supabase, user.id, id);

    return NextResponse.json({ data: quote });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to accept quote";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("Only the RFQ owner")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("already been accepted")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
