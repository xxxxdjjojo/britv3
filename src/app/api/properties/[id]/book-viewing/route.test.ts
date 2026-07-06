/**
 * Tests for POST /api/properties/[id]/book-viewing.
 *
 * Regression guard (schema drift): the `viewing_slots` table keys the property
 * via `listing_id`, NOT `property_id`. An earlier version filtered on a
 * non-existent `property_id` column, which made every booking 404/500. These
 * tests pin the lookup to `listing_id` and cover the happy path + IDOR guard.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SingleResult = { data: unknown; error: unknown };

/** Chainable query-builder mock that records the .eq() and .select() calls. */
function makeQueryBuilder(single: SingleResult) {
  const eqCalls: Array<[string, unknown]> = [];
  const selectCalls: string[] = [];
  const builder = {
    select: vi.fn((cols: string) => {
      selectCalls.push(cols);
      return builder;
    }),
    eq: vi.fn((col: string, val: unknown) => {
      eqCalls.push([col, val]);
      return builder;
    }),
    single: vi.fn(async () => single),
  };
  return { builder, eqCalls, selectCalls };
}

const PROP_UUID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/properties/${PROP_UUID}/book-viewing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: PROP_UUID });

beforeEach(() => {
  mockCreateClient.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/properties/[id]/book-viewing", () => {
  it("looks up viewing_slots by listing_id (not property_id) and books the slot", async () => {
    const slot = makeQueryBuilder({
      data: { id: "slot-1", listing_id: PROP_UUID, status: "available" },
      error: null,
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => slot.builder),
      rpc: vi
        .fn()
        .mockResolvedValue({ data: { success: true, slot_id: "slot-1" }, error: null }),
    });

    const res = await POST(makeRequest({ slotId: "slot-1" }) as never, {
      params,
    } as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true, slotId: "slot-1" });

    // Regression: the slot must be scoped by listing_id, never property_id.
    expect(slot.eqCalls).toContainEqual(["listing_id", PROP_UUID]);
    expect(slot.eqCalls.some(([col]) => col === "property_id")).toBe(false);
    expect(slot.selectCalls.join(",")).toContain("listing_id");
    expect(slot.selectCalls.join(",")).not.toContain("property_id");
  });

  it("returns 404 when the slot does not belong to the property", async () => {
    const slot = makeQueryBuilder({ data: null, error: { message: "no rows" } });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => slot.builder),
      rpc: vi.fn(),
    });

    const res = await POST(makeRequest({ slotId: "slot-x" }) as never, {
      params,
    } as never);

    expect(res.status).toBe(404);
    expect(slot.eqCalls).toContainEqual(["listing_id", PROP_UUID]);
  });

  it("returns 404 for non-UUID property id without hitting the database", async () => {
    const fromFn = vi.fn();
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn() }, from: fromFn, rpc: vi.fn() });

    const res = await POST(makeRequest({ slotId: "slot-1" }) as never, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    } as never);

    expect(res.status).toBe(404);
    expect(fromFn).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests with 401", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: { message: "no session" } }),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    });

    const res = await POST(makeRequest({ slotId: "slot-1" }) as never, {
      params,
    } as never);

    expect(res.status).toBe(401);
  });
});
