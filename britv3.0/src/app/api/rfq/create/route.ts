import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRfq } from "@/services/marketplace/rfq-service";

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
    const rfq = await createRfq(supabase, user.id, body);

    return NextResponse.json({ data: rfq }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create RFQ";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
