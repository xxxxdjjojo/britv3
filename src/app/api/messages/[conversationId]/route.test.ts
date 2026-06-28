/**
 * Validation-contract tests for POST /api/messages/[conversationId].
 *
 * Regression guard (live bug): replying into a conversation whose id — or whose
 * recipient_id — is a non-RFC-4122 UUID (e.g. the seeded landlord
 * 44444444-... or conversation 99999999-...) returned 400 "Invalid UUID"
 * because sendMessageSchema used z.string().uuid(). Postgres accepts any
 * 8-4-4-4-12 hex, so the send path must too. Pin: seeded ids reach the service
 * (201); non-UUID garbage still 400s.
 */

import type { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));
const { mockLimit } = vi.hoisted(() => ({ mockLimit: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));

// Fire-and-forget side effects — inert so tests isolate validation.
vi.mock("@/lib/truedeed/capture-message", () => ({
  captureListingMessageIntroduction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/services/messaging/message-notifications", () => ({
  notifyNewMessage: vi.fn().mockResolvedValue(undefined),
}));

// Keep validation the unit under test — stub only sendMessage so a parsed
// payload reaches a spy. The REAL sendMessageSchema runs in the route.
vi.mock("@/services/messaging/message-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/messaging/message-service")
  >("@/services/messaging/message-service");
  return { ...actual, sendMessage: vi.fn() };
});

import { POST } from "./route";
import { sendMessage } from "@/services/messaging/message-service";

const SEEDED_LANDLORD_ID = "44444444-4444-4444-4444-444444444444";
const SEEDED_CONVERSATION_ID = "99999999-9999-9999-9999-999999999999";

function makePostRequest(body: unknown): NextRequest {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

function makeParams(conversationId: string) {
  return { params: Promise.resolve({ conversationId }) };
}

function authedClient(userId: string) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
  };
}

beforeEach(() => {
  mockCreateClient.mockReset();
  vi.mocked(sendMessage).mockReset();
  mockLimit.mockReset();
  mockLimit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("POST /api/messages/[conversationId] — UUID validation contract", () => {
  it("reaches the service (201) when conversationId + recipient_id are non-RFC-4122 seeded ids", async () => {
    mockCreateClient.mockResolvedValue(authedClient("test-provider"));
    vi.mocked(sendMessage).mockResolvedValueOnce({
      conversation_id: SEEDED_CONVERSATION_ID,
    } as Awaited<ReturnType<typeof sendMessage>>);

    const res = await POST(
      makePostRequest({
        recipient_id: SEEDED_LANDLORD_ID,
        content: "Reply to the landlord",
        context_type: "general",
      }),
      makeParams(SEEDED_CONVERSATION_ID),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toBeDefined();
    expect(sendMessage).toHaveBeenCalledWith(
      expect.anything(),
      "test-provider",
      expect.objectContaining({
        conversation_id: SEEDED_CONVERSATION_ID,
        recipient_id: SEEDED_LANDLORD_ID,
      }),
    );
  });

  it("400s on a non-UUID conversationId (garbage still rejected)", async () => {
    mockCreateClient.mockResolvedValue(authedClient("test-provider"));

    const res = await POST(
      makePostRequest({
        recipient_id: SEEDED_LANDLORD_ID,
        content: "Hi",
        context_type: "general",
      }),
      makeParams("not-a-uuid"),
    );

    expect(res.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("400s on a non-UUID recipient_id (garbage still rejected)", async () => {
    mockCreateClient.mockResolvedValue(authedClient("test-provider"));

    const res = await POST(
      makePostRequest({
        recipient_id: "not-a-uuid",
        content: "Hi",
        context_type: "general",
      }),
      makeParams(SEEDED_CONVERSATION_ID),
    );

    expect(res.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
