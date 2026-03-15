/**
 * Messaging service -- conversation lifecycle, message CRUD, and read status.
 * All functions accept a Supabase client for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  Conversation,
  ContextType,
  InboxFilters,
  Message,
} from "@/types/messaging";
import { sanitizeText } from "@/lib/validation/sanitize";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  recipient_id: z.string().uuid(),
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long (max 5 000 chars)"),
  context_type: z.enum(["listing", "booking", "rfq", "general"]),
  context_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  attachment_url: z.string().url().optional(),
  attachment_type: z.enum(["image", "pdf"]).optional(),
  attachment_size_bytes: z.number().int().positive().optional(),
});

export type SendMessagePayload = z.infer<typeof sendMessageSchema>;

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/**
 * List conversations for a user, with other participant name, last message
 * preview, and unread count.
 */
export async function getConversations(
  supabase: SupabaseClient,
  userId: string,
  filters?: InboxFilters,
): Promise<Conversation[]> {
  // Use an RPC that joins conversations, profiles, messages, and read status.
  // Fallback: query conversations table directly with manual joins.
  let query = supabase
    .from("conversations")
    .select(`
      id,
      participant_1_id,
      participant_2_id,
      context_type,
      context_id,
      last_message_at,
      created_at
    `)
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (filters?.context_type) {
    query = query.eq("context_type", filters.context_type);
  }

  const { data: conversations, error } = await query;

  if (error) throw new Error(`Failed to load conversations: ${error.message}`);
  if (!conversations || conversations.length === 0) return [];

  // Enrich each conversation with participant name, preview, unread count
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId =
        conv.participant_1_id === userId
          ? conv.participant_2_id
          : conv.participant_1_id;

      // Participant name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", otherUserId)
        .single();

      // Last message preview
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Unread count
      const { data: readStatus } = await supabase
        .from("conversation_read_status")
        .select("last_read_at")
        .eq("conversation_id", conv.id)
        .eq("user_id", userId)
        .single();

      const lastReadAt = readStatus?.last_read_at ?? "1970-01-01T00:00:00Z";

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId)
        .gt("created_at", lastReadAt);

      const participantName = profile?.display_name ?? "Unknown User";
      const preview = lastMsg?.content
        ? lastMsg.content.length > 100
          ? lastMsg.content.slice(0, 100) + "..."
          : lastMsg.content
        : null;

      return {
        ...conv,
        last_message_at: new Date(conv.last_message_at),
        created_at: new Date(conv.created_at),
        participant_name: participantName,
        last_message_preview: preview,
        unread_count: unreadCount ?? 0,
      } as Conversation;
    }),
  );

  // Optional search filter (client-side on participant name)
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    return enriched.filter(
      (c) => c.participant_name?.toLowerCase().includes(term),
    );
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// Messages (cursor-based pagination)
// ---------------------------------------------------------------------------

/**
 * Fetch messages in a conversation with cursor-based pagination.
 * Returns newest-first, limited to `limit` (default 20).
 */
export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string,
  cursor?: string,
  limit: number = 20,
): Promise<Message[]> {
  let query = supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      attachment_url,
      attachment_type,
      attachment_size_bytes,
      created_at
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: messages, error } = await query;

  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  if (!messages || messages.length === 0) return [];

  // Enrich with sender name
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", senderIds);

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name]),
  );

  return messages.map((m) => ({
    ...m,
    created_at: new Date(m.created_at),
    sender_name: nameMap.get(m.sender_id) ?? "Unknown User",
  })) as Message[];
}

// ---------------------------------------------------------------------------
// Send message
// ---------------------------------------------------------------------------

/**
 * Send a message, sanitizing content. Creates conversation if needed.
 */
export async function sendMessage(
  supabase: SupabaseClient,
  senderId: string,
  input: SendMessagePayload,
): Promise<Message> {
  const sanitizedContent = sanitizeText(input.content);

  // Ensure conversation exists
  let conversationId = input.conversation_id;

  if (!conversationId) {
    const conv = await getOrCreateConversation(
      supabase,
      senderId,
      input.recipient_id,
      input.context_type,
      input.context_id,
    );
    conversationId = conv.id;
  }

  // Insert message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      ...(input.message_id ? { id: input.message_id } : {}),
      conversation_id: conversationId,
      sender_id: senderId,
      content: sanitizedContent,
      ...(input.attachment_url
        ? {
            attachment_url: input.attachment_url,
            attachment_type: input.attachment_type,
            attachment_size_bytes: input.attachment_size_bytes,
          }
        : {}),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Update conversation last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return {
    ...message,
    created_at: new Date(message.created_at),
    sender_name: null,
  } as Message;
}

// ---------------------------------------------------------------------------
// Get or create conversation
// ---------------------------------------------------------------------------

/**
 * Find existing conversation between two users for a given context,
 * or create a new one.
 */
export async function getOrCreateConversation(
  supabase: SupabaseClient,
  userId: string,
  recipientId: string,
  contextType: ContextType,
  contextId?: string,
): Promise<{ id: string }> {
  // Check for existing conversation (either direction)
  let query = supabase
    .from("conversations")
    .select("id")
    .eq("context_type", contextType)
    .or(
      `and(participant_1_id.eq.${userId},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${userId})`,
    );

  if (contextId) {
    query = query.eq("context_id", contextId);
  }

  const { data: existing } = await query.limit(1).single();

  if (existing) return { id: existing.id };

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      participant_1_id: userId,
      participant_2_id: recipientId,
      context_type: contextType,
      context_id: contextId ?? null,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);

  return { id: created.id };
}

// ---------------------------------------------------------------------------
// Read status
// ---------------------------------------------------------------------------

/**
 * Update (upsert) the read status for a user in a conversation.
 */
export async function updateReadStatus(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("conversation_read_status")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) throw new Error(`Failed to update read status: ${error.message}`);
}

/**
 * Get total unread conversation count for a user.
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  // Get all conversations for user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, last_message_at")
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

  if (!conversations || conversations.length === 0) return 0;

  let unread = 0;

  for (const conv of conversations) {
    const { data: readStatus } = await supabase
      .from("conversation_read_status")
      .select("last_read_at")
      .eq("conversation_id", conv.id)
      .eq("user_id", userId)
      .single();

    const lastReadAt = readStatus?.last_read_at ?? "1970-01-01T00:00:00Z";

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .neq("sender_id", userId)
      .gt("created_at", lastReadAt);

    if (count && count > 0) unread++;
  }

  return unread;
}
