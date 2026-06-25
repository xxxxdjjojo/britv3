import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — admin client, notification + email side-effects, brand url
// ---------------------------------------------------------------------------

const createPlatformEvent = vi.fn().mockResolvedValue({ id: 1 });
const sendNewMessage = vi.fn().mockResolvedValue(undefined);
const adminClient = { from: vi.fn() };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClient,
}));
vi.mock("@/services/notifications/notification-service", () => ({
  createPlatformEvent: (...args: unknown[]) => createPlatformEvent(...args),
}));
vi.mock("@/services/email/email-service", () => ({
  sendNewMessage: (...args: unknown[]) => sendNewMessage(...args),
}));
vi.mock("@/config/brand", () => ({
  appUrl: (path = "") => `https://truedeed.co.uk${path}`,
}));

import { notifyNewMessage } from "@/services/messaging/message-notifications";

const SENDER = "11111111-1111-1111-1111-111111111111";
const RECIPIENT = "22222222-2222-2222-2222-222222222222";
const CONV = "33333333-3333-3333-3333-333333333333";

const OLD = new Date(Date.now() - 10 * 60_000).toISOString(); // 10 min ago — away
const NOW = new Date().toISOString();

/**
 * Build a `.from(table)` router. Each table returns a thenable query builder.
 * `thenValue` resolves an awaited builder (count queries); `singleValue`
 * resolves `.maybeSingle()`.
 */
function wireAdmin(opts: {
  conversation: { data: unknown } | null;
  readStatus: { data: unknown };
  unreadCount: number;
  latest: { data: unknown };
  profiles: { data: unknown };
}) {
  adminClient.from.mockImplementation((table: string) => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    for (const m of ["select", "eq", "neq", "gt", "lt", "or", "order", "limit", "in"]) {
      builder[m] = vi.fn(chain);
    }
    if (table === "conversations") {
      builder.maybeSingle = vi.fn().mockResolvedValue(opts.conversation ?? { data: null });
    } else if (table === "conversation_read_status") {
      builder.maybeSingle = vi.fn().mockResolvedValue(opts.readStatus);
    } else if (table === "messages") {
      // count query awaits the builder; content query calls maybeSingle
      builder.then = vi.fn((resolve: (v: unknown) => void) =>
        resolve({ count: opts.unreadCount, error: null }),
      );
      builder.maybeSingle = vi.fn().mockResolvedValue(opts.latest);
    } else if (table === "profiles") {
      builder.then = vi.fn((resolve: (v: unknown) => void) => resolve(opts.profiles));
    }
    return builder;
  });
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("notifyNewMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifies on the first unread message from an away recipient", async () => {
    wireAdmin({
      conversation: { data: { participant_1_id: SENDER, participant_2_id: RECIPIENT } },
      readStatus: { data: { last_read_at: OLD } },
      unreadCount: 1,
      latest: { data: { content: "Hi, is the flat still available?" } },
      profiles: {
        data: [
          { id: RECIPIENT, email: "r@test.dev", display_name: "Rita Recipient" },
          { id: SENDER, email: "s@test.dev", display_name: "Sam Sender" },
        ],
      },
    });

    await notifyNewMessage({ conversationId: CONV, senderId: SENDER });
    await flush();

    expect(createPlatformEvent).toHaveBeenCalledTimes(1);
    expect(createPlatformEvent).toHaveBeenCalledWith(
      adminClient,
      expect.objectContaining({
        event_type: "new_message",
        entity_type: "conversation",
        entity_id: CONV,
        actor_id: SENDER,
      }),
    );
    expect(sendNewMessage).toHaveBeenCalledTimes(1);
    expect(sendNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: RECIPIENT,
        email: "r@test.dev",
        senderName: "Sam Sender",
        recipientFirstName: "Rita",
        conversationUrl: `https://truedeed.co.uk/inbox/${CONV}`,
      }),
    );
  });

  it("debounces: skips when the recipient already has unread messages", async () => {
    wireAdmin({
      conversation: { data: { participant_1_id: SENDER, participant_2_id: RECIPIENT } },
      readStatus: { data: { last_read_at: OLD } },
      unreadCount: 3,
      latest: { data: { content: "third message" } },
      profiles: { data: [] },
    });

    await notifyNewMessage({ conversationId: CONV, senderId: SENDER });
    await flush();

    expect(createPlatformEvent).not.toHaveBeenCalled();
    expect(sendNewMessage).not.toHaveBeenCalled();
  });

  it("skips when the recipient is actively viewing the conversation", async () => {
    wireAdmin({
      conversation: { data: { participant_1_id: SENDER, participant_2_id: RECIPIENT } },
      readStatus: { data: { last_read_at: NOW } }, // read seconds ago
      unreadCount: 1,
      latest: { data: { content: "hello" } },
      profiles: { data: [] },
    });

    await notifyNewMessage({ conversationId: CONV, senderId: SENDER });
    await flush();

    expect(createPlatformEvent).not.toHaveBeenCalled();
    expect(sendNewMessage).not.toHaveBeenCalled();
  });

  it("does nothing when the conversation cannot be found", async () => {
    wireAdmin({
      conversation: { data: null },
      readStatus: { data: null },
      unreadCount: 0,
      latest: { data: null },
      profiles: { data: [] },
    });

    await notifyNewMessage({ conversationId: CONV, senderId: SENDER });
    await flush();

    expect(createPlatformEvent).not.toHaveBeenCalled();
    expect(sendNewMessage).not.toHaveBeenCalled();
  });

  it("never throws when the recipient has no email (still records the in-app event)", async () => {
    wireAdmin({
      conversation: { data: { participant_1_id: RECIPIENT, participant_2_id: SENDER } },
      readStatus: { data: { last_read_at: OLD } },
      unreadCount: 1,
      latest: { data: { content: "ping" } },
      profiles: { data: [{ id: RECIPIENT, email: null, display_name: "Rita" }] },
    });

    await expect(
      notifyNewMessage({ conversationId: CONV, senderId: SENDER }),
    ).resolves.toBeUndefined();
    await flush();

    expect(createPlatformEvent).toHaveBeenCalledTimes(1);
    expect(sendNewMessage).not.toHaveBeenCalled();
  });
});
