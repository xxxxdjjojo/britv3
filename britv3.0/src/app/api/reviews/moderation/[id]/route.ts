import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateReview } from "@/services/marketplace/moderation-service";

/**
 * PATCH /api/reviews/moderation/[id]
 * Moderate a review in the queue. Auth required (admin only).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { id: queueEntryId } = await params;
    const body = await request.json();

    if (!body.decision || !["approve", "reject", "flag_for_review"].includes(body.decision)) {
      return NextResponse.json(
        { error: "decision must be 'approve', 'reject', or 'flag_for_review'" },
        { status: 400 },
      );
    }

    const result = await moderateReview(
      supabase,
      user.id,
      queueEntryId,
      body.decision,
      body.reason,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to moderate review";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
