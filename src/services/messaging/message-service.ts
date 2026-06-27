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
import type { UserRole } from "@/types/auth";
import { sanitizeText } from "@/lib/validation/sanitize-text";
import { captureException } from "@/lib/observability/capture-exception";
import { postgresUuid } from "@/lib/messaging/conversation-id";

// ---------------------------------------------------------------------------
// Role-relationship validation for messaging (BUG-5)
// ---------------------------------------------------------------------------

/**
 * Thrown when two users are not permitted to message each other. Routes map
 * this to a 403 with the user-facing message (not a generic 500).
 */
export class MessagingAuthorizationError extends Error {
  constructor(message = "You cannot message this user type") {
    super(message);
    this.name = "MessagingAuthorizationError";
  }
}

/** Allowed messaging pairs — sorted alphabetically so lookup is direction-agnostic. */
const ALLOWED_MESSAGING_PAIRS = new Set<string>([
  "agent:homebuyer",
  "agent:renter",
  "agent:seller",
  "landlord:renter",
  "landlord:service_provider",
]);

/**
 * Validate that two users are allowed to message each other based on their
 * active roles. Throws if the pair is not in the allowed list, if either user
 * has no active_role, or if the role lookup fails.
 */
async function validateMessagingRoles(
  supabase: SupabaseClient,
  userId: string,
  recipientId: string,
): Promise<void> {
  let profiles: Array<{ id: string; active_role: UserRole | null }>;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, active_role")
      .in("id", [userId, recipientId]);

    if (error) throw error;
    profiles = data ?? [];
  } catch (err) {
    throw new Error(
      `Failed to look up user roles: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const senderProfile = profiles.find((p) => p.id === userId);
  const recipientProfile = profiles.find((p) => p.id === recipientId);

  const senderRole = senderProfile?.active_role;
  const recipientRole = recipientProfile?.active_role;

  if (!senderRole || !recipientRole) {
    throw new MessagingAuthorizationError();
  }

  const pairKey = [senderRole, recipientRole].sort().join(":");

  if (!ALLOWED_MESSAGING_PAIRS.has(pairKey)) {
    throw new MessagingAuthorizationError();
  }
}

/**
 * Reject if the recipient has blocked this conversation (per-conversation
 * "I marked this as spam, stop their messages"). Checks the recipient's
 * conversation_read_status row for a non-null blocked_at.
 */
async function assertRecipientNotBlocking(
  supabase: SupabaseClient,
  conversationId: string,
  recipientId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("conversation_read_status")
    .select("blocked_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", recipientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check block status: ${error.message}`);
  }

  if (data?.blocked_at) {
    throw new MessagingAuthorizationError(
      "This recipient is no longer accepting messages in this conversation",
    );
  }
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const sendMessageSchema = z.object({
  // Postgres-valid UUID (any version) — not z.string().uuid(), which enforces
  // RFC-4122 bits and spuriously 400s on seeded/legacy ids the DB accepts.
  conversation_id: postgresUuid.optional(),
  recipient_id: postgresUuid,
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long (max 5 000 chars)"),
  context_type: z.enum(["listing", "booking", "rfq", "general"]),
  context_id: postgresUuid.optional(),
  message_id: postgresUuid.optional(),
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
 * preview, and unread count. Uses get_inbox_for_user RPC (1 query vs 4N+1).
 */
export async function getConversations(
  supabase: SupabaseClient,
  userId: string,
  filters?: InboxFilters,
): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc("get_inbox_for_user", {
    p_user_id: userId,
  });

  // A real RPC/DB failure must surface (route returns 500, UI shows the error
  // banner) — it must NOT be swallowed as an empty inbox. An empty result for a
  // healthy query is genuinely-empty and returns [].
  if (error) {
    captureException(error, {
      module: "communication",
      feature: "message-service",
      operation: "getConversations",
      extra: { userId },
    });
    throw new Error(`Failed to load conversations: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  let conversations = (data as Array<{
    id: string;
    participant_1_id: string;
    participant_2_id: string;
    context_type: string;
    context_id: string | null;
    last_message_at: string;
    created_at: string;
    participant_name: string | null;
    last_message_preview: string | null;
    unread_count: number;
    archived_at: string | null;
    blocked_at: string | null;
    draft_text: string | null;
    has_sent: boolean;
  }>).map((row) => ({
    id: row.id,
    participant_1_id: row.participant_1_id,
    participant_2_id: row.participant_2_id,
    context_type: row.context_type as ContextType,
    context_id: row.context_id,
    last_message_at: new Date(row.last_message_at),
    created_at: new Date(row.created_at),
    participant_name: row.participant_name,
    last_message_preview: row.last_message_preview,
    unread_count: Number(row.unread_count),
    archived_at: row.archived_at ? new Date(row.archived_at) : null,
    blocked_at: row.blocked_at ? new Date(row.blocked_at) : null,
    draft_text: row.draft_text,
    has_sent: Boolean(row.has_sent),
  } as Conversation));

  // Apply client-side filters that RPC doesn't handle
  if (filters?.context_type) {
    conversations = conversations.filter(
      (c) => c.context_type === filters.context_type,
    );
  }

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    conversations = conversations.filter(
      (c) =>
        c.participant_name?.toLowerCase().includes(term) ||
        c.last_message_preview?.toLowerCase().includes(term),
    );
  }

  return conversations;
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
    // getOrCreateConversation runs the block check on the resolved conversation.
    const conv = await getOrCreateConversation(
      supabase,
      senderId,
      input.recipient_id,
      input.context_type,
      input.context_id,
    );
    conversationId = conv.id;
  } else {
    // Existing conversation supplied directly — enforce the recipient's block.
    await assertRecipientNotBlocking(supabase, conversationId, input.recipient_id);
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
  // Validate role pairing before any DB lookup (BUG-5)
  await validateMessagingRoles(supabase, userId, recipientId);

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

  if (existing) {
    await assertRecipientNotBlocking(supabase, existing.id, recipientId);
    return { id: existing.id };
  }

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

  await assertRecipientNotBlocking(supabase, created.id, recipientId);

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

// ---------------------------------------------------------------------------
// Folder state: archive / block / drafts
// ---------------------------------------------------------------------------

/**
 * Archive (or un-archive) a conversation for a user. Upserts only archived_at;
 * last_read_at keeps its row default on insert and is left untouched on update.
 */
export async function archiveConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  archived: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("conversation_read_status")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        archived_at: archived ? new Date().toISOString() : null,
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) throw new Error(`Failed to archive conversation: ${error.message}`);
}

/**
 * Block (or unblock) a conversation for a user — a per-conversation "stop their
 * messages" flag. Upserts only blocked_at.
 */
export async function setConversationBlocked(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  blocked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("conversation_read_status")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        blocked_at: blocked ? new Date().toISOString() : null,
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) throw new Error(`Failed to update block status: ${error.message}`);
}

/**
 * Save (or clear) an unsent draft for a user in a conversation. Empty or
 * whitespace-only text clears the draft (null).
 */
export async function saveDraft(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  const { error } = await supabase
    .from("conversation_read_status")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        draft_text: trimmed.length > 0 ? text : null,
        draft_updated_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) throw new Error(`Failed to save draft: ${error.message}`);
}

/**
 * Get the saved draft text for a user in a conversation, or null if none.
 */
export async function getDraft(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("conversation_read_status")
    .select("draft_text")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load draft: ${error.message}`);

  return data?.draft_text ?? null;
}

/**
 * Get total unread conversation count for a user.
 * Uses get_unread_count RPC (1 query vs N×2 sequential queries).
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_unread_count", {
    p_user_id: userId,
  });

  if (error) {
    captureException(error, {
      module: "communication",
      feature: "message-service",
      operation: "getUnreadCount",
      extra: { userId },
    });
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  return Number(data ?? 0);
}
