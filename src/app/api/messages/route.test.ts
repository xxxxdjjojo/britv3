/**
 * Auth-contract tests for the messaging API.
 *
 * Regression guard: GET /api/messages must return 200 for an authenticated
 * request and 401 for an anonymous one. The live "Failed to load conversations"
 * banner was a prod 500 (a jsdom asset missing from the serverless bundle, fixed
 * via outputFileTracingIncludes), but the auth contract is the other way this
 * route can break the inbox — pin both states here.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

// Keep the route's auth contract the unit under test — stub the data layer so
// the assertions isolate getUser() → status code.
vi.mock("@/services/messaging/message-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/messaging/message-service")
  >("@/services/messaging/message-service");
  return {
    ...actual,
    getConversations: vi.fn().mockResolvedValue([]),
    getUnreadCount: vi.fn().mockResolvedValue(0),
  };
});

import { GET } from "./route";
import { getConversations } from "@/services/messaging/message-service";

function makeRequest(qs = ""): never {
  const url = new URL(`http://localhost/api/messages${qs ? `?${qs}` : ""}`);
  return { nextUrl: url } as never;
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
});
