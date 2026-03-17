import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, agent_response } = body as { id?: string; agent_response?: string };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing review id" }, { status: 400 });
  }

  if (!agent_response || typeof agent_response !== "string" || agent_response.trim().length < 1) {
    return NextResponse.json({ error: "Missing agent_response" }, { status: 400 });
  }

  // Confirm the review belongs to this user
  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select("id, reviewee_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if ((existing as { reviewee_id: string }).reviewee_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      agent_response: agent_response.trim(),
      responded_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
