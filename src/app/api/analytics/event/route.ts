/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AnalyticsEventType } from "@/types/seller";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      listing_id: string;
      event_type: AnalyticsEventType;
      visitor_fingerprint?: string;
    };

    if (!body.listing_id || !body.event_type) {
      return NextResponse.json({ error: "listing_id and event_type are required" }, { status: 400 });
    }

    const validEvents: AnalyticsEventType[] = ["view", "save", "enquiry", "phone_click", "email_click"];
    if (!validEvents.includes(body.event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const { error } = await supabase.from("listing_analytics_events").insert({
      listing_id: body.listing_id,
      event_type: body.event_type,
      visitor_fingerprint: body.visitor_fingerprint ?? null,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/analytics/event] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
