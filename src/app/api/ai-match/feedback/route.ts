/**
 * /api/ai-match/feedback
 *
 * POST — Record user feedback (dismissed / interested) on an AI match result.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FeedbackBody = {
  listing_id: string;
  feedback_type: "dismissed" | "interested";
};

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: FeedbackBody;
  try {
    body = (await req.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.listing_id || typeof body.listing_id !== "string") {
    return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
  }

  if (!["dismissed", "interested"].includes(body.feedback_type)) {
    return NextResponse.json(
      { error: "feedback_type must be 'dismissed' or 'interested'" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("ai_match_feedback")
    .upsert(
      {
        user_id: user.id,
        listing_id: body.listing_id,
        feedback_type: body.feedback_type,
      },
      { onConflict: "user_id,listing_id" },
    );

  if (error) {
    console.error("[ai-match/feedback] Upsert error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
