/**
 * Unit tests for folder bucketing helpers. A conversation may live in several
 * folders at once (Gmail-style), so the membership rules and counts must be
 * independent per folder.
 */

import { describe, it, expect } from "vitest";
import { filterByFolder, folderCounts } from "./folders";
import type { Conversation } from "@/types/messaging";

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "c1",
    participant_1_id: "u1",
    participant_2_id: "u2",
    context_type: "general",
    context_id: null,
    last_message_at: new Date("2026-01-01T00:00:00Z"),
    created_at: new Date("2026-01-01T00:00:00Z"),
    participant_name: "Alice",
    last_message_preview: "hi",
    unread_count: 0,
    archived_at: null,
    blocked_at: null,
    draft_text: null,
    has_sent: false,
    ...overrides,
  };
}

describe("filterByFolder", () => {
  it("inbox: not archived and not blocked", () => {
    const plain = makeConversation({ id: "plain" });
    const archived = makeConversation({ id: "arc", archived_at: new Date() });
    const blocked = makeConversation({ id: "blk", blocked_at: new Date() });

    const result = filterByFolder([plain, archived, blocked], "inbox");

    expect(result.map((c) => c.id)).toEqual(["plain"]);
  });

  it("unread: not archived, not blocked, unread_count > 0", () => {
    const unread = makeConversation({ id: "unread", unread_count: 3 });
    const read = makeConversation({ id: "read", unread_count: 0 });
    const unreadArchived = makeConversation({
      id: "ua",
      unread_count: 2,
      archived_at: new Date(),
    });
    const unreadBlocked = makeConversation({
      id: "ub",
      unread_count: 2,
      blocked_at: new Date(),
    });

    const result = filterByFolder(
      [unread, read, unreadArchived, unreadBlocked],
      "unread",
    );

    expect(result.map((c) => c.id)).toEqual(["unread"]);
  });

  it("sent: has_sent regardless of archive state", () => {
    const sent = makeConversation({ id: "sent", has_sent: true });
    const sentArchived = makeConversation({
      id: "sa",
      has_sent: true,
      archived_at: new Date(),
    });
    const notSent = makeConversation({ id: "ns", has_sent: false });

    const result = filterByFolder([sent, sentArchived, notSent], "sent");

    expect(result.map((c) => c.id)).toEqual(["sent", "sa"]);
  });

  it("drafts: draft_text is a non-empty string", () => {
    const withDraft = makeConversation({ id: "d", draft_text: "wip" });
    const emptyDraft = makeConversation({ id: "e", draft_text: "" });
    const noDraft = makeConversation({ id: "n", draft_text: null });

    const result = filterByFolder([withDraft, emptyDraft, noDraft], "drafts");

    expect(result.map((c) => c.id)).toEqual(["d"]);
  });

  it("archived: archived_at != null", () => {
    const archived = makeConversation({ id: "a", archived_at: new Date() });
    const plain = makeConversation({ id: "p" });

    const result = filterByFolder([archived, plain], "archived");

    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("spam: blocked_at != null", () => {
    const blocked = makeConversation({ id: "b", blocked_at: new Date() });
    const plain = makeConversation({ id: "p" });

    const result = filterByFolder([blocked, plain], "spam");

    expect(result.map((c) => c.id)).toEqual(["b"]);
  });

  it("supports multi-membership: a sent conversation with a draft and unread", () => {
    const multi = makeConversation({
      id: "multi",
      unread_count: 1,
      has_sent: true,
      draft_text: "later",
    });

    expect(filterByFolder([multi], "inbox").map((c) => c.id)).toEqual(["multi"]);
    expect(filterByFolder([multi], "unread").map((c) => c.id)).toEqual(["multi"]);
    expect(filterByFolder([multi], "sent").map((c) => c.id)).toEqual(["multi"]);
    expect(filterByFolder([multi], "drafts").map((c) => c.id)).toEqual(["multi"]);
  });

  it("returns an empty array for empty input", () => {
    expect(filterByFolder([], "inbox")).toEqual([]);
    expect(filterByFolder([], "spam")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [
      makeConversation({ id: "a", archived_at: new Date() }),
      makeConversation({ id: "b" }),
    ];
    const snapshot = [...input];

    filterByFolder(input, "inbox");

    expect(input).toEqual(snapshot);
    expect(input.length).toBe(2);
  });
});

describe("folderCounts", () => {
  it("counts every folder independently with multi-membership", () => {
    const conversations: Conversation[] = [
      makeConversation({ id: "1", unread_count: 2, has_sent: true }),
      makeConversation({ id: "2", draft_text: "draft", has_sent: true }),
      makeConversation({ id: "3", archived_at: new Date(), has_sent: true }),
      makeConversation({ id: "4", blocked_at: new Date() }),
      makeConversation({ id: "5" }),
    ];

    const counts = folderCounts(conversations);

    // inbox: not archived, not blocked → 1, 2, 5
    expect(counts.inbox).toBe(3);
    // unread: only 1
    expect(counts.unread).toBe(1);
    // sent: 1, 2, 3
    expect(counts.sent).toBe(3);
    // drafts: 2
    expect(counts.drafts).toBe(1);
    // archived: 3
    expect(counts.archived).toBe(1);
    // spam: 4
    expect(counts.spam).toBe(1);
  });

  it("returns all-zero counts for empty input", () => {
    expect(folderCounts([])).toEqual({
      inbox: 0,
      unread: 0,
      sent: 0,
      drafts: 0,
      archived: 0,
      spam: 0,
    });
  });
});
