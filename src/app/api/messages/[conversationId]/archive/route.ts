/**
 * POST /api/messages/[conversationId]/archive -- archive or un-archive a
 * conversation for the current user. Body: { archived: boolean }.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { archiveConversation } from "@/services/messaging/message-service";
import { captureException } from "@/lib/observability/capture-exception";

type RouteParams = { params: Promise<{ conversationId: string }> };

const bodySchema = z.object({ archived: z.boolean() });

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    if (!z.string().uuid().safeParse(conversationId).success) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    await archiveConversation(supabase, conversationId, user.id, parsed.data.archived);
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureException(err, {
      module: "communication",
      feature: "messaging-api",
      route: "/api/messages/[conversationId]/archive",
      operation: "POST",
    });
    return NextResponse.json({ error: "Failed to archive conversation" }, { status: 500 });
  }
}
