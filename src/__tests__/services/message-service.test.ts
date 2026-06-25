import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  updateReadStatus,
  getUnreadCount,
  MessagingAuthorizationError,
} from "@/services/messaging/message-service";
import { validateAttachment } from "@/services/messaging/attachment-service";

// ---------------------------------------------------------------------------
// Mock sanitize (isomorphic-dompurify is not available in happy-dom)
// ---------------------------------------------------------------------------

vi.mock("@/lib/validation/sanitize", () => ({
  sanitizeText: vi.fn((text: string) => text.replace(/<[^>]*>/g, "")),
}));

// ---------------------------------------------------------------------------
// Helper: create a mock Supabase client with table-specific builders
// ---------------------------------------------------------------------------

type MockBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createBuilder(resolveValue: { data: unknown; error: unknown; count?: number | null }): MockBuilder {
  const builder: MockBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(resolveValue)),
  };
  return builder;
}

function createMockClient(tableResolvers: Record<string, { data: unknown; error: unknown; count?: number | null }>) {
  const builders: Record<string, MockBuilder> = {};

  for (const [table, value] of Object.entries(tableResolvers)) {
    builders[table] = createBuilder(value);
  }

  // Default builder for unknown tables
  const defaultBuilder = createBuilder({ data: null, error: null });

  const fromFn = vi.fn((table: string) => builders[table] ?? defaultBuilder);

  return {
    from: fromFn,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-aaa" } } }) },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://storage.example.com/file.jpg" } }),
      }),
    },
    _builders: builders,
  } as unknown as SupabaseClient & { _builders: Record<string, MockBuilder> };
}

// ---------------------------------------------------------------------------
// Tests: getConversations
// ---------------------------------------------------------------------------

describe("getConversations", () => {
  it("returns conversations with participant names and unread counts", async () => {
    // Service now uses get_inbox_for_user RPC which returns enriched rows
    // (participant_name, last_message_preview, unread_count) directly.
    const rpcData = [
      {
        id: "conv-001",
        participant_1_id: "user-aaa",
        participant_2_id: "user-bbb",
        context_type: "general",
        context_id: null,
        last_message_at: "2026-01-15T10:00:00Z",
        created_at: "2026-01-15T09:00:00Z",
        participant_name: "Bob Smith",
        last_message_preview: "Hello there",
        unread_count: 2,
      },
    ];

    const client = {
      from: vi.fn(() => createBuilder({ data: null, error: null })),
      rpc: vi.fn().mockResolvedValue({ data: rpcData, error: null }),
    } as unknown as SupabaseClient;

    const result = await getConversations(client, "user-aaa");

    expect(result).toHaveLength(1);
    expect(result[0].participant_name).toBe("Bob Smith");
    expect(result[0].last_message_preview).toBe("Hello there");
    expect(result[0].unread_count).toBe(2);
  });

  it("returns empty array when no conversations exist", async () => {
    const client = {
      from: vi.fn(() => createBuilder({ data: [], error: null })),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient;

    const result = await getConversations(client, "user-aaa");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: getMessages
// ---------------------------------------------------------------------------

describe("getMessages", () => {
  it("returns messages with sender names", async () => {
    const messagesData = [
      {
        id: "msg-001",
        conversation_id: "conv-001",
        sender_id: "user-aaa",
        content: "Hello",
        attachment_url: null,
        attachment_type: null,
        attachment_size_bytes: null,
        created_at: "2026-01-15T10:00:00Z",
      },
    ];

    let callIndex = 0;
    const builders = [
      createBuilder({ data: messagesData, error: null }),
      createBuilder({ data: [{ id: "user-aaa", display_name: "Alice" }], error: null }),
    ];

    const client = {
      from: vi.fn(() => {
        const b = builders[callIndex] ?? createBuilder({ data: null, error: null });
        callIndex++;
        return b;
      }),
    } as unknown as SupabaseClient;

    const result = await getMessages(client, "conv-001");
    expect(result).toHaveLength(1);
    expect(result[0].sender_name).toBe("Alice");
  });

  it("applies cursor filter for pagination", async () => {
    const cursor = "2026-01-15T09:00:00Z";

    let callIndex = 0;
    const messagesBuilder = createBuilder({ data: [], error: null });
    const profilesBuilder = createBuilder({ data: [], error: null });
    const builders = [messagesBuilder, profilesBuilder];

    const client = {
      from: vi.fn(() => {
        const b = builders[callIndex] ?? createBuilder({ data: null, error: null });
        callIndex++;
        return b;
      }),
    } as unknown as SupabaseClient;

    await getMessages(client, "conv-001", cursor);

    // lt should have been called with the cursor
    expect(messagesBuilder.lt).toHaveBeenCalledWith("created_at", cursor);
  });
});

// ---------------------------------------------------------------------------
// Tests: sendMessage
// ---------------------------------------------------------------------------

describe("sendMessage", () => {
  it("sanitizes content before insert", async () => {
    const { sanitizeText } = await import("@/lib/validation/sanitize");

    const insertedMsg = {
      id: "msg-new",
      conversation_id: "conv-001",
      sender_id: "user-aaa",
      content: "Clean text",
      attachment_url: null,
      attachment_type: null,
      attachment_size_bytes: null,
      created_at: "2026-01-15T10:00:00Z",
    };

    let callIndex = 0;
    const msgBuilder = createBuilder({ data: insertedMsg, error: null });
    const convBuilder = createBuilder({ data: null, error: null });
    const builders = [msgBuilder, convBuilder];

    const client = {
      from: vi.fn(() => {
        const b = builders[callIndex] ?? createBuilder({ data: null, error: null });
        callIndex++;
        return b;
      }),
    } as unknown as SupabaseClient;

    await sendMessage(client, "user-aaa", {
      conversation_id: "conv-001",
      recipient_id: "user-bbb",
      content: "<script>alert('xss')</script>Hello",
      context_type: "general",
    });

    expect(sanitizeText).toHaveBeenCalledWith("<script>alert('xss')</script>Hello");
  });

  it("creates conversation first when conversation_id is missing", async () => {
    const insertedMsg = {
      id: "msg-new",
      conversation_id: "conv-new",
      sender_id: "user-aaa",
      content: "Hi",
      created_at: "2026-01-15T10:00:00Z",
    };

    let callIndex = 0;
    // getOrCreateConversation: validateMessagingRoles -> profiles select (thenable list)
    // getOrCreateConversation: conversations select (single -> not found)
    // getOrCreateConversation: conversations insert (single -> created)
    // sendMessage: messages insert (single -> msg)
    // sendMessage: conversations update
    const builders = [
      createBuilder({
        data: [
          { id: "user-aaa", active_role: "renter" },
          { id: "user-bbb", active_role: "landlord" },
        ],
        error: null,
      }), // profiles validation
      createBuilder({ data: null, error: null }), // existing conv check
      createBuilder({ data: { id: "conv-new" }, error: null }), // insert conv
      createBuilder({ data: insertedMsg, error: null }), // insert msg
      createBuilder({ data: null, error: null }), // update last_message_at
    ];

    const client = {
      from: vi.fn(() => {
        const b = builders[callIndex] ?? createBuilder({ data: null, error: null });
        callIndex++;
        return b;
      }),
    } as unknown as SupabaseClient;

    const result = await sendMessage(client, "user-aaa", {
      recipient_id: "user-bbb",
      content: "Hi",
      context_type: "general",
    });

    expect(result.conversation_id).toBe("conv-new");
  });
});

// ---------------------------------------------------------------------------
// Tests: getOrCreateConversation
// ---------------------------------------------------------------------------

describe("getOrCreateConversation", () => {
  it("returns existing conversation if one exists", async () => {
    let callIndex = 0;
    // validateMessagingRoles makes a profiles call first, then the conversation select
    const builders = [
      createBuilder({
        data: [
          { id: "user-aaa", active_role: "renter" },
          { id: "user-bbb", active_role: "landlord" },
        ],
        error: null,
      }), // profiles validation
      createBuilder({ data: { id: "conv-existing" }, error: null }), // existing conv
    ];

    const client = {
      from: vi.fn(() => {
        const b = builders[callIndex] ?? createBuilder({ data: null, error: null });
        callIndex++;
        return b;
      }),
    } as unknown as SupabaseClient;

    const result = await getOrCreateConversation(
      client,
      "user-aaa",
      "user-bbb",
      "general",
    );

    expect(result.id).toBe("conv-existing");
    // Validation + lookup = 2 from() calls (no insert needed)
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("throws MessagingAuthorizationError for a disallowed role pair", async () => {
    // homebuyer <-> seller is not an allowed messaging pair
    const client = {
      from: vi.fn(() =>
        createBuilder({
          data: [
            { id: "user-aaa", active_role: "homebuyer" },
            { id: "user-bbb", active_role: "seller" },
          ],
          error: null,
        }),
      ),
    } as unknown as SupabaseClient;

    await expect(
      getOrCreateConversation(client, "user-aaa", "user-bbb", "general"),
    ).rejects.toBeInstanceOf(MessagingAuthorizationError);

    // Rejected before any conversation lookup/insert — only the profiles read ran
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(client.from).toHaveBeenCalledWith("profiles");
  });
});

// ---------------------------------------------------------------------------
// Tests: updateReadStatus
// ---------------------------------------------------------------------------

describe("updateReadStatus", () => {
  it("upserts read status correctly", async () => {
    const builder = createBuilder({ data: null, error: null });

    const client = {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient;

    await updateReadStatus(client, "conv-001", "user-aaa");

    expect(client.from).toHaveBeenCalledWith("conversation_read_status");
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: "conv-001",
        user_id: "user-aaa",
      }),
      { onConflict: "conversation_id,user_id" },
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: getUnreadCount
// ---------------------------------------------------------------------------

describe("getUnreadCount", () => {
  it("returns correct count of unread conversations", async () => {
    // Service now uses get_unread_count RPC which returns the count directly.
    const client = {
      from: vi.fn(() => createBuilder({ data: null, error: null })),
      rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
    } as unknown as SupabaseClient;

    const count = await getUnreadCount(client, "user-aaa");
    expect(count).toBe(1); // Only conv-002 has unread messages
  });
});

// ---------------------------------------------------------------------------
// Tests: attachment validation
// ---------------------------------------------------------------------------

describe("validateAttachment", () => {
  it("rejects files larger than 2MB", async () => {
    const largeFile = new File(
      [new ArrayBuffer(3 * 1024 * 1024)],
      "large.jpg",
      { type: "image/jpeg" },
    );

    const result = await validateAttachment(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("rejects non-image/pdf files", async () => {
    // Create a file with executable-like magic bytes
    const bytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // MZ header (EXE)
    const exeFile = new File([bytes], "malware.exe", {
      type: "application/x-msdownload",
    });

    const result = await validateAttachment(exeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });

  it("accepts valid JPEG files", async () => {
    // JPEG magic bytes: FF D8 FF
    const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const jpegFile = new File([jpegBytes], "photo.jpg", {
      type: "image/jpeg",
    });

    const result = await validateAttachment(jpegFile);
    expect(result.valid).toBe(true);
    expect(result.type).toBe("image");
    expect(result.mime).toBe("image/jpeg");
  });

  it("accepts valid PDF files", async () => {
    // PDF magic bytes: %PDF (25 50 44 46)
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const pdfFile = new File([pdfBytes], "document.pdf", {
      type: "application/pdf",
    });

    const result = await validateAttachment(pdfFile);
    expect(result.valid).toBe(true);
    expect(result.type).toBe("pdf");
    expect(result.mime).toBe("application/pdf");
  });
});
