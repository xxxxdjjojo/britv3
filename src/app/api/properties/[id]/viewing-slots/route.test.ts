import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Chainable query-builder mock that resolves an array result (not .single()). */
function makeArrayBuilder(result: { data: unknown; error: unknown }) {
  const eqCalls: Array<[string, unknown]> = [];
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((col: string, val: unknown) => {
      eqCalls.push([col, val]);
      return builder;
    }),
    gte: vi.fn(() => builder),
    order: vi.fn().mockResolvedValue(result),
  };
  return { builder, eqCalls };
}

function makeRequest(id: string): Request {
  return new Request(`http://localhost/api/properties/${id}/viewing-slots`);
}

beforeEach(() => {
  mockCreateClient.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/properties/[id]/viewing-slots", () => {
  it("returns 200 {slots:[]} for non-UUID id without hitting the database", async () => {
    const fromFn = vi.fn();
    mockCreateClient.mockResolvedValue({ from: fromFn });

    const res = await GET(makeRequest("mock-1") as never, {
      params: Promise.resolve({ id: "mock-1" }),
    } as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ slots: [] });
    expect(fromFn).not.toHaveBeenCalled();
  });

  it("queries by listing_id with valid UUID and returns aliased slots", async () => {
    const uuid = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";
    const { builder, eqCalls } = makeArrayBuilder({
      data: [{ id: "slot-1", starts_at: "2027-01-01T10:00:00Z", ends_at: "2027-01-01T10:30:00Z" }],
      error: null,
    });

    mockCreateClient.mockResolvedValue({ from: vi.fn(() => builder) });

    const res = await GET(makeRequest(uuid) as never, {
      params: Promise.resolve({ id: uuid }),
    } as never);

    expect(res.status).toBe(200);
    const json = await res.json() as { slots: unknown[] };
    expect(json.slots).toHaveLength(1);
    expect(eqCalls).toContainEqual(["listing_id", uuid]);
    expect(eqCalls).toContainEqual(["status", "available"]);
  });

  it("returns 500 on database error", async () => {
    const uuid = "aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa";
    const { builder } = makeArrayBuilder({ data: null, error: { message: "connection refused" } });

    mockCreateClient.mockResolvedValue({ from: vi.fn(() => builder) });

    const res = await GET(makeRequest(uuid) as never, {
      params: Promise.resolve({ id: uuid }),
    } as never);

    expect(res.status).toBe(500);
  });
});
