/**
 * Shared messaging test fixtures.
 * All data is deterministic (no random values) for snapshot-safe tests.
 */

import type {
  Conversation,
  Message,
  SendMessageInput,
} from "@/types/messaging";

const FIXED_DATE = new Date("2026-01-15T10:00:00Z");

// ---------------------------------------------------------------------------
// Conversation fixtures
// ---------------------------------------------------------------------------

export function createMockConversation(
  overrides?: Partial<Conversation>,
): Conversation {
  return {
    id: "conv-001",
    participant_1_id: "user-aaa",
    participant_2_id: "user-bbb",
    context_type: "general",
    context_id: null,
    last_message_at: FIXED_DATE,
    created_at: FIXED_DATE,
    participant_name: "Alice Johnson",
    last_message_preview: "Hi, I have a question about the property.",
    unread_count: 1,
    archived_at: null,
    blocked_at: null,
    draft_text: null,
    has_sent: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Message fixtures
// ---------------------------------------------------------------------------

export function createMockMessage(overrides?: Partial<Message>): Message {
  return {
    id: "msg-001",
    conversation_id: "conv-001",
    sender_id: "user-aaa",
    content: "Hi, I have a question about the property.",
    attachment_url: null,
    attachment_type: null,
    attachment_size_bytes: null,
    created_at: FIXED_DATE,
    sender_name: "Alice Johnson",
    ...overrides,
  };
}

export function createMockMessageWithAttachment(
  type: "image" | "pdf",
): Message {
  const attachments = {
    image: {
      attachment_url: "https://storage.example.com/uploads/photo.jpg",
      attachment_type: "image" as const,
      attachment_size_bytes: 245_760,
    },
    pdf: {
      attachment_url: "https://storage.example.com/uploads/report.pdf",
      attachment_type: "pdf" as const,
      attachment_size_bytes: 1_048_576,
    },
  };

  return createMockMessage({
    id: "msg-002",
    content: type === "image" ? "Here is a photo" : "Please find the report attached",
    ...attachments[type],
  });
}

// ---------------------------------------------------------------------------
// Input fixtures
// ---------------------------------------------------------------------------

export function createMockSendMessageInput(
  overrides?: Partial<SendMessageInput>,
): SendMessageInput {
  return {
    conversation_id: "conv-001",
    recipient_id: "user-bbb",
    content: "Thanks for your message, I will check and get back to you.",
    context_type: "general",
    ...overrides,
  };
}
