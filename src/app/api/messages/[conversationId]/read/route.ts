/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * POST /api/messages/[conversationId]/read -- mark conversation as read.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateReadStatus } from "@/services/messaging/message-service";

type RouteParams = { params: Promise<{ conversationId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    await updateReadStatus(supabase, conversationId, user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/messages/conversationId/read]", err);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
