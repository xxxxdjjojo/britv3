import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createQuote } from "@/services/marketplace/quote-service";

export async function POST(request: Request) {
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

    const body = await request.json();

    if (!body.service_request_id) {
      return NextResponse.json(
        { error: "service_request_id is required" },
        { status: 400 },
      );
    }

    const quote = await createQuote(supabase, user.id, body);

    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create quote";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("not verified") || message.includes("Provider profile not found")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
