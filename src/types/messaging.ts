/**
 * Messaging domain types -- conversations and messages.
 * Mirrors the conversations/messages tables in 003_dashboards_communication.sql.
 */

// -- Enums -------------------------------------------------------------------

/** Context linking a conversation to a domain entity */
export type ContextType = "listing" | "booking" | "rfq" | "general";

/** Allowed attachment MIME type categories */
export type AttachmentType = "image" | "pdf";

// -- Table row types ---------------------------------------------------------

/** Mirrors public.conversations table (with joined fields) */
export type Conversation = Readonly<{
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  context_type: ContextType;
  context_id: string | null;
  last_message_at: Date;
  created_at: Date;
  /** Joined: other participant's display name */
  participant_name: string | null;
  /** Joined: preview text from last message */
  last_message_preview: string | null;
  /** Computed: count of unread messages for current user */
  unread_count: number;
  /** Per-user: when the current user archived this conversation (null if not) */
  archived_at: Date | null;
  /** Per-user: when the current user blocked this conversation (null if not) */
  blocked_at: Date | null;
  /** Per-user: saved unsent draft for this conversation (null if none) */
  draft_text: string | null;
  /** Computed: whether the current user has sent any message here */
  has_sent: boolean;
}>;

/** Mirrors public.messages table (with joined fields) */
export type Message = Readonly<{
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  attachment_size_bytes: number | null;
  created_at: Date;
  /** Joined: sender's display name */
  sender_name: string | null;
}>;

/** Mirrors public.conversation_read_status table */
export type ConversationReadStatus = Readonly<{
  conversation_id: string;
  user_id: string;
  last_read_at: Date;
}>;

// -- Input types -------------------------------------------------------------

/** Input for sending a new message (or starting a new conversation) */
export type SendMessageInput = Readonly<{
  /** Omit to start a new conversation */
  conversation_id?: string;
  recipient_id: string;
  content: string;
  context_type: ContextType;
  context_id?: string;
  attachment?: File;
}>;

/** Filters for the inbox view */
export type InboxFilters = Readonly<{
  context_type?: ContextType;
  search?: string;
}>;

/** Inbox folder views */
export type Folder = "inbox" | "unread" | "sent" | "drafts" | "archived" | "spam";
