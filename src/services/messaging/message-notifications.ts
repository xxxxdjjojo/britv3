/**
 * New-message notification fan-out (in-app feed + away email).
 *
 * Runs server-side only, with the service-role client, because it must read the
 * recipient's read status and profile and write a platform event on their
 * behalf — operations the sender's RLS-scoped client cannot perform.
 *
 * Debounced to the "transition to unread" moment: a recipient is notified at
 * most once per unread burst per conversation. Concretely, we notify only when
 *   (a) this is the FIRST unread message from the sender since the recipient
 *       last read the conversation, AND
 *   (b) the recipient is not actively viewing it (last read > ACTIVE_GRACE ago).
 * This keeps an active back-and-forth quiet (realtime delivery covers it) and
 * surfaces exactly one notification + one email when someone is away.
 *
 * Fire-and-forget: never throws, never blocks the send.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPlatformEvent } from "@/services/notifications/notification-service";
import { sendNewMessage } from "@/services/email/email-service";
import { appUrl } from "@/config/brand";

/** Recipients who read the conversation within this window are "active". */
const ACTIVE_GRACE_MS = 60_000;

/** Max characters of message body surfaced in the feed/email preview. */
const PREVIEW_MAX = 140;

type NotifyInput = Readonly<{
  conversationId: string;
  senderId: string;
}>;

function buildPreview(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > PREVIEW_MAX
    ? `${trimmed.slice(0, PREVIEW_MAX - 1)}…`
    : trimmed;
}

function firstName(displayName: string | null): string {
  if (!displayName) return "there";
  return displayName.trim().split(" ")[0] || "there";
}

export async function notifyNewMessage(input: NotifyInput): Promise<void> {
  try {
    const admin = createAdminClient();

    // 1. Resolve the recipient (the other participant).
    const { data: conversation } = await admin
      .from("conversations")
      .select("participant_1_id, participant_2_id")
      .eq("id", input.conversationId)
      .maybeSingle();

    if (!conversation) return;

    const recipientId =
      conversation.participant_1_id === input.senderId
        ? conversation.participant_2_id
        : conversation.participant_1_id;

    if (!recipientId || recipientId === input.senderId) return;

    // 2. When did the recipient last read this conversation?
    const { data: readStatus } = await admin
      .from("conversation_read_status")
      .select("last_read_at")
      .eq("conversation_id", input.conversationId)
      .eq("user_id", recipientId)
      .maybeSingle();

    const lastReadAt = readStatus?.last_read_at
      ? new Date(readStatus.last_read_at)
      : new Date(0);

    // Active-viewer guard: if they read it seconds ago, realtime has them
    // covered — don't notify.
    if (Date.now() - lastReadAt.getTime() < ACTIVE_GRACE_MS) return;

    // 3. Debounce: notify only on the first unread message from the sender
    //    since the recipient last read. Subsequent messages in the same burst
    //    are skipped until the recipient catches up.
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", input.conversationId)
      .eq("sender_id", input.senderId)
      .gt("created_at", lastReadAt.toISOString());

    if ((count ?? 0) !== 1) return;

    // 4. Build the preview from the latest message in the conversation.
    const { data: latest } = await admin
      .from("messages")
      .select("content")
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const preview = buildPreview(latest?.content ?? "");

    // 5. In-app feed event (also feeds the daily/weekly digest). new_message is
    //    a DIGEST event, so this does NOT trigger an immediate critical email —
    //    we send the message email ourselves below, debounced and pref-gated.
    await createPlatformEvent(admin, {
      event_type: "new_message",
      entity_type: "conversation",
      entity_id: input.conversationId,
      actor_id: input.senderId,
      metadata: { preview },
    });

    // 6. Away email — fire-and-forget, gated by `email_messages` preference.
    void dispatchEmail(admin, {
      recipientId,
      senderId: input.senderId,
      conversationId: input.conversationId,
      preview,
    });
  } catch (err) {
    console.warn("[messaging] notifyNewMessage failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }
}

async function dispatchEmail(
  admin: ReturnType<typeof createAdminClient>,
  args: Readonly<{
    recipientId: string;
    senderId: string;
    conversationId: string;
    preview: string;
  }>,
): Promise<void> {
  try {
    const { data: people } = await admin
      .from("profiles")
      .select("id, email, display_name")
      .in("id", [args.recipientId, args.senderId]);

    const recipient = people?.find((p) => p.id === args.recipientId);
    const sender = people?.find((p) => p.id === args.senderId);

    if (!recipient?.email) return;

    await sendNewMessage({
      userId: args.recipientId,
      email: recipient.email,
      recipientFirstName: firstName(recipient.display_name),
      senderName: sender?.display_name ?? "Someone",
      messagePreview: args.preview,
      conversationUrl: appUrl(`/inbox/${args.conversationId}`),
    });
  } catch (err) {
    console.warn("[messaging] new-message email dispatch failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }
}
