/**
 * Auth-contract tests for POST /api/messages/[conversationId]/archive.
 * Pins 200 (authed), 401 (anon), 400 (bad param / bad body), 500 (service fail).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

vi.mock("@/services/messaging/message-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/messaging/message-service")
  >("@/services/messaging/message-service");
  return { ...actual, archiveConversation: vi.fn().mockResolvedValue(undefined) };
});

import { POST } from "./route";
import { archiveConversation } from "@/services/messaging/message-service";

const CONVO_ID = "22222222-2222-4222-8222-222222222222";

function makeRequest(body: unknown = { archived: true }) {
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
  vi.mocked(archiveConversation).mockReset();
  vi.mocked(archiveConversation).mockResolvedValue(undefined);
});

describe("POST /api/messages/[conversationId]/archive", () => {
  it("returns 200 and calls the service when authenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await POST(makeRequest({ archived: true }), context());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(archiveConversation).toHaveBeenCalledWith(
      expect.anything(),
      CONVO_ID,
      "user-aaa",
      true,
    );
  });

  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await POST(makeRequest(), context());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(archiveConversation).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-uuid conversationId", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await POST(makeRequest(), context("not-a-uuid"));

    expect(res.status).toBe(400);
    expect(archiveConversation).not.toHaveBeenCalled();
  });

  it("returns 400 when archived is missing/not a boolean", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await POST(makeRequest({ archived: "yes" }), context());

    expect(res.status).toBe(400);
    expect(archiveConversation).not.toHaveBeenCalled();
  });

  it("returns 500 on a service failure", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(archiveConversation).mockRejectedValueOnce(new Error("db exploded"));

    const res = await POST(makeRequest(), context());

    expect(res.status).toBe(500);
  });
});
