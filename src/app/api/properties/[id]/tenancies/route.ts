import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenancies, createTenancy } from "@/services/landlord/tenancy-service";
import { tenancySchema } from "@/types/landlord";

export async function GET(
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

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;

    const tenancies = await getTenancies(supabase, id, status);
    return NextResponse.json({ data: tenancies });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch tenancies";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
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
    const parsed = tenancySchema.parse(body);
    const tenancy = await createTenancy(supabase, id, parsed);

    return NextResponse.json({ data: tenancy }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create tenancy";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
