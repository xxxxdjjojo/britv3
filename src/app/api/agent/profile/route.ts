import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agent_agency_profiles")
    .select("*")
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Remove fields that should not be set by the client
  delete body.id;
  delete body.agent_id;
  delete body.created_at;
  delete body.updated_at;

  const { data, error } = await supabase
    .from("agent_agency_profiles")
    .upsert(
      { agent_id: user.id, ...body, updated_at: new Date().toISOString() },
      { onConflict: "agent_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
