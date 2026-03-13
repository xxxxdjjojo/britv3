/**
 * /api/agent/reviews
 *
 * GET   -- fetch reviews for the authenticated agent.
 * PATCH -- update a review with the agent's response.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_entity_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      agent_response?: string;
    };

    if (!body.id || !body.agent_response) {
      return NextResponse.json(
        { error: "id and agent_response are required" },
        { status: 400 },
      );
    }

    if (body.agent_response.length > 500) {
      return NextResponse.json(
        { error: "Response must be 500 characters or fewer" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("reviews")
      .update({
        agent_response: body.agent_response,
        responded_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("reviewed_entity_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Review not found or not owned by you" },
        { status: 404 },
      );
    }

    return NextResponse.json({ review: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
