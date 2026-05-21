/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * GET /api/messages -- list conversations for current user.
 *   ?count_only=true returns { count: number } (unread conversations).
 *   ?context_type=listing filters by context type.
 *   ?search=name filters by participant name.
 *
 * POST /api/messages -- send a new message (creates conversation if needed).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getConversations,
  getUnreadCount,
  sendMessage,
  sendMessageSchema,
} from "@/services/messaging/message-service";
import { createRateLimiter } from "@/lib/cache/redis";
import type { InboxFilters, ContextType } from "@/types/messaging";

/** 10 messages per minute per user — shared across message endpoints. */
const messageRateLimiter = createRateLimiter(10, "1 m");

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    // Count-only mode for unread badge
    if (searchParams.get("count_only") === "true") {
      const count = await getUnreadCount(supabase, user.id);
      return NextResponse.json({ count });
    }

    // Full inbox listing
    const contextType = searchParams.get("context_type");
    const search = searchParams.get("search");

    const filters: InboxFilters = {
      ...(contextType ? { context_type: contextType as ContextType } : {}),
      ...(search ? { search } : {}),
    };

    const conversations = await getConversations(supabase, user.id, filters);
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[GET /api/messages]", err);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 messages per minute per user
    const { success, reset } = await messageRateLimiter.limit(user.id);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const msg = await sendMessage(supabase, user.id, parsed.data);
    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
