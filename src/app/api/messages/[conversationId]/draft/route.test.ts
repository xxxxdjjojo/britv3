/**
 * Auth-contract tests for the draft route.
 *   PUT    saves a draft   GET reads it   DELETE clears it.
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
    saveDraft: vi.fn().mockResolvedValue(undefined),
    getDraft: vi.fn().mockResolvedValue(null),
  };
});

import { GET, PUT, DELETE } from "./route";
import { saveDraft, getDraft } from "@/services/messaging/message-service";

const CONVO_ID = "22222222-2222-4222-8222-222222222222";

function makeRequest(body?: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Request;
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
  vi.mocked(saveDraft).mockReset();
  vi.mocked(saveDraft).mockResolvedValue(undefined);
  vi.mocked(getDraft).mockReset();
  vi.mocked(getDraft).mockResolvedValue(null);
});

describe("PUT /api/messages/[conversationId]/draft", () => {
  it("returns 200 and saves the draft when authenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await PUT(makeRequest({ text: "draft body" }), context());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(saveDraft).toHaveBeenCalledWith(
      expect.anything(),
      CONVO_ID,
      "user-aaa",
      "draft body",
    );
  });

  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await PUT(makeRequest({ text: "x" }), context());

    expect(res.status).toBe(401);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-uuid conversationId", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await PUT(makeRequest({ text: "x" }), context("bad"));

    expect(res.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("returns 400 when text is not a string", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await PUT(makeRequest({ text: 42 }), context());

    expect(res.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("returns 500 on a service failure", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(saveDraft).mockRejectedValueOnce(new Error("db exploded"));

    const res = await PUT(makeRequest({ text: "x" }), context());

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/messages/[conversationId]/draft", () => {
  it("clears the draft (saveDraft with empty string) when authenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await DELETE(makeRequest(), context());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(saveDraft).toHaveBeenCalledWith(
      expect.anything(),
      CONVO_ID,
      "user-aaa",
      "",
    );
  });

  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await DELETE(makeRequest(), context());

    expect(res.status).toBe(401);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-uuid conversationId", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await DELETE(makeRequest(), context("bad"));

    expect(res.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });
});

describe("GET /api/messages/[conversationId]/draft", () => {
  it("returns the draft text when authenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));
    vi.mocked(getDraft).mockResolvedValueOnce("seeded draft");

    const res = await GET(makeRequest(), context());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ draft: "seeded draft" });
    expect(getDraft).toHaveBeenCalledWith(expect.anything(), CONVO_ID, "user-aaa");
  });

  it("returns 401 for an anonymous request", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    const res = await GET(makeRequest(), context());

    expect(res.status).toBe(401);
    expect(getDraft).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-uuid conversationId", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-aaa"));

    const res = await GET(makeRequest(), context("bad"));

    expect(res.status).toBe(400);
    expect(getDraft).not.toHaveBeenCalled();
  });
});
