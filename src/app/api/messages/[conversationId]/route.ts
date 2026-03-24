/**
 * GET /api/messages/[conversationId] -- get messages with cursor pagination.
 *   ?cursor=ISO-date  load older messages before this timestamp.
 *   ?limit=20         page size (default 20).
 *
 * POST /api/messages/[conversationId] -- send message to existing conversation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMessages,
  sendMessage,
  sendMessageSchema,
} from "@/services/messaging/message-service";
import { createRateLimiter } from "@/lib/cache/redis";

/** 10 messages per minute per user — shared across message endpoints. */
const messageRateLimiter = createRateLimiter(10, "1 m");

type RouteParams = { params: Promise<{ conversationId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 20;

    const messages = await getMessages(supabase, conversationId, cursor, limit);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[GET /api/messages/conversationId]", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { conversationId } = await params;
    const body = await request.json();

    // Merge conversationId into payload
    const parsed = sendMessageSchema.safeParse({
      ...body,
      conversation_id: conversationId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const msg = await sendMessage(supabase, user.id, parsed.data);
    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages/conversationId]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
