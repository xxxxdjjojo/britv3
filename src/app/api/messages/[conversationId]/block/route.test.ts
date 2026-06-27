/**
 * Auth-contract tests for POST /api/messages/[conversationId]/block.
 * Pins 200 (authed), 401 (anon), 400 (bad param / bad body), 500 (service fail).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

vi.mock("@/services/messaging/message-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/messaging/message-service")
  >("@/services/messaging/message-service");
  return {
    ...actual,
    setConversationBlocked: vi.fn().mockResolvedValue(undefined),
  };
});

import { POST } from "./route";
import { setConversationBlocked } from "@/services/messaging/message-service";

const CONVO_ID = "22222222-2222-4222-8222-222222222222";

function makeRequest(body: unknown = { blocked: true }) {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as Request;
}

function context(conversationId = CONVO_ID) {
  return { params: Promise.resolve({ conversationId }) };
}

function authedClient(userId: string) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
  };
}

function anonClient() {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } };
}

beforeEach(() => {
  mockCreateClient.mockReset();
  vi.mocked(setConversationBlocked).mockReset();
  vi.mocked(setConversationBlocked).mockResolvedValue(undefined);
});

describe("POST /api/messages/[conversationId]/block", () => {
  it("returns 200 and calls the service when authenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await POST(makeRequest({ blocked: false }), context());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(setConversationBlocked).toHaveBeenCalledWith(
      expect.anything(),
      CONVO_ID,
      "user-aaa",
      false,
    );
  });

  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await POST(makeRequest(), context());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(setConversationBlocked).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-uuid conversationId", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await POST(makeRequest(), context("not-a-uuid"));

    expect(res.status).toBe(400);
    expect(setConversationBlocked).not.toHaveBeenCalled();
  });

  it("accepts a Postgres-valid non-v4 UUID (reaches the service, not 400)", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    // Nil UUID — Postgres-valid but rejected by z.string().uuid() (version nibble 0).
    const nonV4 = "00000000-0000-0000-0000-000000000000";

    const res = await POST(makeRequest({ blocked: true }), context(nonV4));

    expect(res.status).toBe(200);
    expect(setConversationBlocked).toHaveBeenCalledWith(
      expect.anything(),
      nonV4,
      "user-aaa",
      true,
    );
  });

  it("returns 400 when blocked is not a boolean", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await POST(makeRequest({ blocked: 1 }), context());

    expect(res.status).toBe(400);
    expect(setConversationBlocked).not.toHaveBeenCalled();
  });

  it("returns 500 on a service failure", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(setConversationBlocked).mockRejectedValueOnce(
      new Error("db exploded"),
    );

    const res = await POST(makeRequest(), context());

    expect(res.status).toBe(500);
  });
});
