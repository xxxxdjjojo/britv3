/**
 * Auth-contract tests for the messaging API.
 *
 * Regression guard: GET /api/messages must return 200 for an authenticated
 * request and 401 for an anonymous one. The live "Failed to load conversations"
 * banner was a prod 500 (a jsdom asset missing from the serverless bundle, fixed
 * by keeping isomorphic-dompurify/jsdom external + a DOM-free sanitizeText — see
 * route.jsdom-bundle.test.ts), but the auth contract is the other way this route
 * can break the inbox — pin both states, for GET and POST.
 */

import type { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));
const { mockLimit } = vi.hoisted(() => ({ mockLimit: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

// Rate limiter is module-level in the route — stub the factory so every POST
// passes the limit unless a test overrides mockLimit.
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));

// Fire-and-forget side effects — keep them inert so POST tests isolate auth.
vi.mock("@/lib/truedeed/capture-message", () => ({
  captureListingMessageIntroduction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/services/messaging/message-notifications", () => ({
  notifyNewMessage: vi.fn().mockResolvedValue(undefined),
}));

// Keep the route's auth contract the unit under test — stub the data layer so
// the assertions isolate getUser() → status code. MessagingAuthorizationError
// is the REAL class so `instanceof` in the route matches.
vi.mock("@/services/messaging/message-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/messaging/message-service")
  >("@/services/messaging/message-service");
  return {
    ...actual,
    getConversations: vi.fn().mockResolvedValue([]),
    getUnreadCount: vi.fn().mockResolvedValue(0),
    sendMessage: vi.fn(),
  };
});

import { GET, POST } from "./route";
import {
  getConversations,
  getUnreadCount,
  sendMessage,
  MessagingAuthorizationError,
} from "@/services/messaging/message-service";

function makeRequest(qs = ""): NextRequest {
  const url = new URL(`http://localhost/api/messages${qs ? `?${qs}` : ""}`);
  return { nextUrl: url } as NextRequest;
}

const VALID_BODY = {
  recipient_id: "11111111-1111-4111-8111-111111111111",
  content: "Hello there",
  context_type: "general" as const,
};

function makePostRequest(body: unknown = VALID_BODY): NextRequest {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

function authedClient(userId: string) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
  };
}

function anonClient() {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  };
}

beforeEach(() => {
  mockCreateClient.mockReset();
  vi.mocked(getConversations).mockClear();
  vi.mocked(getUnreadCount).mockClear();
  vi.mocked(sendMessage).mockReset();
  mockLimit.mockReset();
  mockLimit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
});

describe("GET /api/messages — auth contract", () => {
  it("returns 200 for an authenticated request", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ conversations: [] });
    expect(getConversations).toHaveBeenCalledWith(
      expect.anything(),
      "user-aaa",
      expect.any(Object),
    );
  });

  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(getConversations).not.toHaveBeenCalled();
  });

  it("returns 200 for the count_only unread badge when authenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await GET(makeRequest("count_only=true"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ count: 0 });
  });

  it("surfaces a service failure as 500 (not a silent empty inbox)", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(getConversations).mockRejectedValueOnce(
      new Error("Failed to load conversations: rpc exploded"),
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to load inbox" });
  });

  it("surfaces a count_only service failure as 500", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(getUnreadCount).mockRejectedValueOnce(
      new Error("Failed to load unread count: rpc exploded"),
    );

    const res = await GET(makeRequest("count_only=true"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to load inbox" });
  });
});

describe("POST /api/messages — auth contract", () => {
  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await POST(makePostRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("returns 403 when the service throws MessagingAuthorizationError", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(sendMessage).mockRejectedValueOnce(new MessagingAuthorizationError());

    const res = await POST(makePostRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(typeof body.error).toBe("string");
  });

  it("returns 500 on a generic service failure", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(sendMessage).mockRejectedValueOnce(new Error("db exploded"));

    const res = await POST(makePostRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to send message" });
  });

  it("returns 201 on a successful send", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(sendMessage).mockResolvedValueOnce({
      conversation_id: "22222222-2222-4222-8222-222222222222",
    } as Awaited<ReturnType<typeof sendMessage>>);

    const res = await POST(makePostRequest());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toBeDefined();
  });
});
