import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/agent/reviews/[id]/respond
 *
 * Saves the agent's public response to a review.
 * Only the authenticated agent who is the reviewed_user_id may respond.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { response?: string };
  const responseText = body.response?.trim();

  if (!responseText) {
    return NextResponse.json(
      { error: "response text is required" },
      { status: 400 },
    );
  }

  if (responseText.length > 500) {
    return NextResponse.json(
      { error: "response must be 500 characters or fewer" },
      { status: 422 },
    );
  }

  // Verify the review belongs to this agent before updating
  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("id")
    .eq("id", id)
    .eq("reviewed_user_id", user.id)
    .single();

  if (fetchError || !review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      agent_response: responseText,
      responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("reviewed_user_id", user.id);

  if (updateError) {
    console.error("Failed to save review response:", updateError);
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
