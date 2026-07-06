import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient, mockSendViewingRequestEmails } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockSendViewingRequestEmails: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/services/viewings/viewing-notifications", () => ({
  sendViewingRequestEmails: mockSendViewingRequestEmails,
}));

import { POST } from "./route";

const PROP_UUID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/properties/${PROP_UUID}/request-viewing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: PROP_UUID });
const goodBody = { preferredTime: "2027-04-02T14:00:00Z", notes: "weekends" };

beforeEach(() => {
  mockCreateClient.mockReset();
  mockSendViewingRequestEmails.mockReset();
});

describe("POST /api/properties/[id]/request-viewing", () => {
  it("returns 404 for a non-UUID property id", async () => {
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn() }, rpc: vi.fn() });
    const res = await POST(makeRequest(goodBody) as never, {
      params: Promise.resolve({ id: "mock-1" }),
    } as never);
    expect(res.status).toBe(404);
  });

  it("rejects unauthenticated requests with 401", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      rpc: vi.fn(),
    });
    const res = await POST(makeRequest(goodBody) as never, { params } as never);
    expect(res.status).toBe(401);
  });

  it("requires a preferredTime", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
      rpc: vi.fn(),
    });
    const res = await POST(makeRequest({ notes: "x" }) as never, { params } as never);
    expect(res.status).toBe(400);
  });

  it("maps the RPC and sends the host email on success", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { success: true, viewing_id: "v1" }, error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
      rpc,
    });

    const res = await POST(makeRequest(goodBody) as never, { params } as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true, viewingId: "v1" });
    expect(rpc).toHaveBeenCalledWith("request_viewing", {
      p_listing_id: PROP_UUID,
      p_user_id: "u1",
      p_preferred_time: goodBody.preferredTime,
      p_notes: "weekends",
    });
    expect(mockSendViewingRequestEmails).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when the user already has an open request", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { error: "already_requested" }, error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
      rpc,
    });

    const res = await POST(makeRequest(goodBody) as never, { params } as never);
    expect(res.status).toBe(409);
    expect(mockSendViewingRequestEmails).not.toHaveBeenCalled();
  });

  it("returns 403 for an own-listing request", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { error: "own_listing" }, error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
      rpc,
    });

    const res = await POST(makeRequest(goodBody) as never, { params } as never);
    expect(res.status).toBe(403);
  });
});
