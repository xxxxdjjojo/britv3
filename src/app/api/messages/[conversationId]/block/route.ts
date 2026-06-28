/**
 * POST /api/messages/[conversationId]/block -- block or unblock a conversation
 * for the current user. Body: { blocked: boolean }.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { setConversationBlocked } from "@/services/messaging/message-service";
import { isPostgresUuid } from "@/lib/messaging/conversation-id";
import { captureException } from "@/lib/observability/capture-exception";

type RouteParams = { params: Promise<{ conversationId: string }> };

const bodySchema = z.object({ blocked: z.boolean() });

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    if (!isPostgresUuid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    await setConversationBlocked(supabase, conversationId, user.id, parsed.data.blocked);
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureException(err, {
      module: "communication",
      feature: "messaging-api",
      route: "/api/messages/[conversationId]/block",
      operation: "POST",
    });
    return NextResponse.json({ error: "Failed to update block status" }, { status: 500 });
  }
}
