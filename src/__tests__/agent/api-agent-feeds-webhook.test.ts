/**
 * Tests 9-10: agent feeds webhook route
 * Test 9: valid payload -> agent_feed_sync_log row inserted -> 200
 * Test 10: malformed payload (missing payload field) -> 422
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted so mockInsert is available when vi.mock factory is called
const { mockInsert } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      insert: mockInsert,
    }),
  }),
}));

import { POST } from "@/app/api/agent/feeds/webhook/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const url = "http://localhost/api/agent/feeds/webhook?agent_id=agent-001";
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/feeds/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: insert succeeds
    mockInsert.mockResolvedValue({ error: null });
  });

  it("Test 9: valid payload -> inserts sync log row -> 200 { received: true }", async () => {
    const req = makeRequest({
      provider: "reapit",
      payload: { listings: [{ id: "L001", price: 350000 }] },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(mockInsert).toHaveBeenCalledOnce();

    // Verify what was inserted
    const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg["provider"]).toBe("reapit");
    expect(insertArg["agent_id"]).toBe("agent-001");
    expect(insertArg["status"]).toBe("pending");
    expect(insertArg["raw_payload"]).toEqual({ listings: [{ id: "L001", price: 350000 }] });
  });

  it("Test 10: missing payload field -> 422 { error: 'Malformed payload' }", async () => {
    // Body has provider but no `payload` field
    const req = makeRequest({
      provider: "alto",
      // payload is intentionally omitted
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json).toMatchObject({ error: "Malformed payload" });
    // Should NOT insert
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("Test 10b: invalid JSON body -> 422 { error: 'Malformed payload' }", async () => {
    const url = "http://localhost/api/agent/feeds/webhook?agent_id=agent-001";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{{",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json).toMatchObject({ error: "Malformed payload" });
  });

  it("unknown provider -> 400", async () => {
    const req = makeRequest({
      provider: "unknown_crm",
      payload: { foo: "bar" },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
