/**
 * /api/agent/feeds/webhook
 *
 * POST -- receive an inbound property feed payload from a CRM provider.
 *
 * Processing pipeline: POST receives → validate → insert agent_feed_sync_log → Supabase pg_cron processes pending rows
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_PROVIDERS = ["reapit", "alto", "jupix"] as const;
type FeedProvider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(value: unknown): value is FeedProvider {
  return VALID_PROVIDERS.includes(value as FeedProvider);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 422 });
    }

    // 2. Validate provider (accept from body or x-feed-provider header)
    const provider =
      body["provider"] ?? request.headers.get("x-feed-provider");

    if (!provider || !isValidProvider(provider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    // 3. Validate payload field exists
    if (!("payload" in body) || body["payload"] === undefined) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 422 });
    }

    // 4. Get Supabase server client
    const supabase = await createClient();

    // 5. Resolve agent_id — from query param or x-agent-id header
    //    (webhook callers are external CRMs; they pass agent_id out-of-band)
    const agentId =
      request.nextUrl.searchParams.get("agent_id") ??
      request.headers.get("x-agent-id") ??
      (typeof body["agent_id"] === "string" ? body["agent_id"] : null);

    if (!agentId) {
      return NextResponse.json(
        { error: "agent_id is required" },
        { status: 400 },
      );
    }

    // 6. INSERT into agent_feed_sync_log with status 'pending'
    const { error: insertError } = await supabase
      .from("agent_feed_sync_log")
      .insert({
        agent_id: agentId,
        provider,
        raw_payload: body["payload"],
        status: "pending",
        received_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[feeds/webhook] insert error:", insertError.message);
      return NextResponse.json(
        { error: "Failed to queue feed payload" },
        { status: 500 },
      );
    }

    // 7. Return 200 immediately — processing happens async via pg_cron
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error processing feed";
    console.error("[feeds/webhook] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
