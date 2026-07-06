import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient, mockSendViewingBookedEmails } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockSendViewingBookedEmails: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/services/viewings/viewing-notifications", () => ({
  sendViewingBookedEmails: mockSendViewingBookedEmails,
}));

import { POST } from "./route";

/** Minimal viewings lookup builder used by the route before the RPC. */
function viewingLookup() {
  const b = {
    select: vi.fn(() => b),
    eq: vi.fn(() => b),
    maybeSingle: vi.fn(async () => ({
      data: { listing_id: "listing-1", user_id: "buyer-1" },
      error: null,
    })),
  };
  return () => b;
}

const VIEWING_ID = "6daad3ed-57a1-4987-8fb7-0b3c8b41add8";

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/viewings/requests/${VIEWING_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: VIEWING_ID });

beforeEach(() => mockCreateClient.mockReset());

describe("POST /api/viewings/requests/[id]", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      rpc: vi.fn(),
    });

    const res = await POST(makeRequest({ action: "confirm" }) as never, { params } as never);
    expect(res.status).toBe(401);
  });

  it("rejects an invalid action with 400", async () => {
    const rpc = vi.fn();
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } }, error: null }) },
      from: viewingLookup(),
      rpc,
    });

    const res = await POST(makeRequest({ action: "bogus" }) as never, { params } as never);
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps a confirm to the respond_viewing_request RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { success: true, action: "confirm" }, error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } }, error: null }) },
      from: viewingLookup(),
      rpc,
    });

    const res = await POST(
      makeRequest({ action: "confirm", slotId: "slot-9" }) as never,
      { params } as never,
    );

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("respond_viewing_request", {
      p_viewing_id: VIEWING_ID,
      p_action: "confirm",
      p_slot_id: "slot-9",
    });
  });

  it("returns 404 when the RPC reports not_found", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { error: "not_found" }, error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } }, error: null }) },
      from: viewingLookup(),
      rpc,
    });

    const res = await POST(makeRequest({ action: "decline" }) as never, { params } as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when the RPC reports forbidden", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { error: "forbidden" }, error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } }, error: null }) },
      from: viewingLookup(),
      rpc,
    });

    const res = await POST(makeRequest({ action: "confirm" }) as never, { params } as never);
    expect(res.status).toBe(403);
  });
});
