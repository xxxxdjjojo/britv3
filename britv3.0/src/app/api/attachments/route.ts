/**
 * POST /api/attachments -- upload a file attachment for a message.
 * Expects multipart/form-data with fields: file, conversationId, messageId.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadAttachment } from "@/services/messaging/attachment-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const conversationId = formData.get("conversationId") as string | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!conversationId || !messageId) {
      return NextResponse.json(
        { error: "conversationId and messageId are required" },
        { status: 400 },
      );
    }

    const result = await uploadAttachment(supabase, file, conversationId, messageId);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
