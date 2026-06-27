/**
 * Draft route for a conversation, scoped to the current user.
 *   GET    -> { draft: string | null }   seed the composer on a deep link.
 *   PUT    body { text: string }          save (whitespace-only clears).
 *   DELETE                                clear the draft.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { saveDraft, getDraft } from "@/services/messaging/message-service";
import { isPostgresUuid } from "@/lib/messaging/conversation-id";
import { captureException } from "@/lib/observability/capture-exception";

type RouteParams = { params: Promise<{ conversationId: string }> };

const bodySchema = z.object({ text: z.string() });

const ROUTE = "/api/messages/[conversationId]/draft";

export async function GET(_request: Request, { params }: RouteParams) {
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

    const draft = await getDraft(supabase, conversationId, user.id);
    return NextResponse.json({ draft });
  } catch (err) {
    captureException(err, {
      module: "communication",
      feature: "messaging-api",
      route: ROUTE,
      operation: "GET",
    });
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
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

    await saveDraft(supabase, conversationId, user.id, parsed.data.text);
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureException(err, {
      module: "communication",
      feature: "messaging-api",
      route: ROUTE,
      operation: "PUT",
    });
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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

    await saveDraft(supabase, conversationId, user.id, "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureException(err, {
      module: "communication",
      feature: "messaging-api",
      route: ROUTE,
      operation: "DELETE",
    });
    return NextResponse.json({ error: "Failed to clear draft" }, { status: 500 });
  }
}
