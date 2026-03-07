import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateTenancy } from "@/services/landlord/tenancy-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Request body must contain at least one field to update" },
        { status: 400 },
      );
    }

    const tenancy = await updateTenancy(supabase, id, body);

    return NextResponse.json({ data: tenancy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update tenancy";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
