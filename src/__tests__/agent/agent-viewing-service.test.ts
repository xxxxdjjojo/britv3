import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAgentViewingSlots,
  createViewingSlot,
  updateViewingSlot,
  deleteViewingSlot,
} from "@/services/agent/agent-viewing-service";

const AGENT_ID = "33333333-3333-3333-3333-333333333333";
const LISTING_ID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";
const REP_LISTING_ID = "cccccccc-0007-0007-0007-cccccccccccc";
const SLOT_ID = "a5156744-782c-4b28-8a92-b7389f1774d0";
const BUYER_ID = "dddddddd-0008-0008-0008-dddddddddddd";

// ---------------------------------------------------------------------------
// Mock builder
// ---------------------------------------------------------------------------

type Op = {
  table: string;
  select?: string;
  insert?: unknown;
  update?: unknown;
  eq: Array<[string, unknown]>;
  deleted?: boolean;
  inValues?: unknown[];
};

/**
 * Build a supabase mock that handles multiple from() targets.
 * `tableResults` maps table name → FIFO queue of results.
 * Tables not in the map default to { data: [], error: null }.
 */
function makeSupabase(tableResults: Record<string, Array<{ data: unknown; error: unknown }>>) {
  const ops: Op[] = [];

  const next = (table: string) => {
    const queue = tableResults[table];
    return queue?.shift() ?? { data: [], error: null };
  };

  const from = vi.fn((table: string) => {
    const op: Op = { table, eq: [] };
    ops.push(op);
    // `then` allows the builder itself to be awaited by Promise.all (for
    // queries that have no terminal .order()/.single() call, e.g. the listings
    // and listing_agents queries in resolveAgentListingIds).
    const builder: Record<string, unknown> = {
      select: vi.fn((s: string) => {
        op.select = s;
        return builder;
      }),
      insert: vi.fn((v: unknown) => {
        op.insert = v;
        return builder;
      }),
      update: vi.fn((v: unknown) => {
        op.update = v;
        return builder;
      }),
      delete: vi.fn(() => {
        op.deleted = true;
        return builder;
      }),
      eq: vi.fn((c: string, v: unknown) => {
        op.eq.push([c, v]);
        return builder;
      }),
      in: vi.fn((_col: string, vals: unknown[]) => {
        op.inValues = vals;
        return builder;
      }),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      order: vi.fn(async () => next(table)),
      single: vi.fn(async () => next(table)),
      then: vi.fn((resolve: (v: unknown) => void) => resolve(next(table))),
    };
    return builder;
  });

  return { supabase: { from } as never, ops };
}

/**
 * Convenience: build a supabase mock with a simple FIFO queue (single table
 * scenario — the old helper shape used in create/update/delete tests).
 */
function makeSimpleSupabase(results: Array<{ data: unknown; error: unknown }>) {
  const ops: Op[] = [];
  const next = () => results.shift() ?? { data: null, error: null };
  const from = vi.fn((table: string) => {
    const op: Op = { table, eq: [] };
    ops.push(op);
    const builder: Record<string, unknown> = {
      select: vi.fn((s: string) => {
        op.select = s;
        return builder;
      }),
      insert: vi.fn((v: unknown) => {
        op.insert = v;
        return builder;
      }),
      update: vi.fn((v: unknown) => {
        op.update = v;
        return builder;
      }),
      delete: vi.fn(() => {
        op.deleted = true;
        return builder;
      }),
      eq: vi.fn((c: string, v: unknown) => {
        op.eq.push([c, v]);
        return builder;
      }),
      in: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      order: vi.fn(async () => next()),
      single: vi.fn(async () => next()),
    };
    return builder;
  });
  return { supabase: { from } as never, ops };
}

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// getAgentViewingSlots — new multi-table scoping
// ---------------------------------------------------------------------------

describe("getAgentViewingSlots — scope to owned + represented listings", () => {
  it("returns slots from listings the agent owns", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewing_slots: [
        {
          data: [
            {
              id: SLOT_ID,
              listing_id: LISTING_ID,
              agent_id: AGENT_ID,
              start_time: "2027-03-29T10:00:00Z",
              end_time: "2027-03-29T10:30:00Z",
              status: "available",
              booked_by: null,
              notes: null,
              created_at: "2027-03-01T00:00:00Z",
            },
          ],
          error: null,
        },
      ],
      profiles: [{ data: [], error: null }],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots).toHaveLength(1);
    expect(slots[0].property_id).toBe(LISTING_ID);
    expect(slots[0].is_booked).toBe(false);
    expect(slots[0].booked_by_name).toBeNull();
  });

  it("returns slots from listings the agent represents but does not own", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [], error: null }],
      listing_agents: [{ data: [{ listing_id: REP_LISTING_ID }], error: null }],
      viewing_slots: [
        {
          data: [
            {
              id: SLOT_ID,
              listing_id: REP_LISTING_ID,
              agent_id: "owner-agent-id",
              start_time: "2027-03-29T10:00:00Z",
              end_time: "2027-03-29T10:30:00Z",
              status: "booked",
              booked_by: BUYER_ID,
              notes: null,
              created_at: "2027-03-01T00:00:00Z",
            },
          ],
          error: null,
        },
      ],
      profiles: [
        { data: [{ id: BUYER_ID, display_name: "Alice Buyer" }], error: null },
      ],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots).toHaveLength(1);
    expect(slots[0].property_id).toBe(REP_LISTING_ID);
    expect(slots[0].is_booked).toBe(true);
  });

  it("populates booked_by_name from the profiles lookup", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewing_slots: [
        {
          data: [
            {
              id: SLOT_ID,
              listing_id: LISTING_ID,
              agent_id: AGENT_ID,
              start_time: "2027-03-29T10:00:00Z",
              end_time: "2027-03-29T10:30:00Z",
              status: "booked",
              booked_by: BUYER_ID,
              notes: null,
              created_at: "2027-03-01T00:00:00Z",
            },
          ],
          error: null,
        },
      ],
      profiles: [
        { data: [{ id: BUYER_ID, display_name: "Bob Buyer" }], error: null },
      ],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots[0].booked_by).toBe(BUYER_ID);
    expect(slots[0].booked_by_name).toBe("Bob Buyer");
  });

  it("returns booked_by_name as null when profile is not found", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewing_slots: [
        {
          data: [
            {
              id: SLOT_ID,
              listing_id: LISTING_ID,
              agent_id: AGENT_ID,
              start_time: "2027-03-29T10:00:00Z",
              end_time: "2027-03-29T10:30:00Z",
              status: "booked",
              booked_by: BUYER_ID,
              notes: null,
              created_at: "2027-03-01T00:00:00Z",
            },
          ],
          error: null,
        },
      ],
      // profile not in list
      profiles: [{ data: [], error: null }],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots[0].booked_by_name).toBeNull();
  });

  it("returns [] when the agent owns and represents no listings", async () => {
    const { supabase, ops } = makeSupabase({
      listings: [{ data: [], error: null }],
      listing_agents: [{ data: [], error: null }],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots).toEqual([]);
    // Should not query viewing_slots or profiles when listing set is empty
    expect(ops.some((o) => o.table === "viewing_slots")).toBe(false);
  });

  it("deduplicates when the same listing appears in both owned and represented sets", async () => {
    const { supabase, ops } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [{ listing_id: LISTING_ID }], error: null }],
      viewing_slots: [
        {
          data: [
            {
              id: SLOT_ID,
              listing_id: LISTING_ID,
              agent_id: AGENT_ID,
              start_time: "2027-03-29T10:00:00Z",
              end_time: "2027-03-29T10:30:00Z",
              status: "available",
              booked_by: null,
              notes: null,
              created_at: "2027-03-01T00:00:00Z",
            },
          ],
          error: null,
        },
      ],
      profiles: [{ data: [], error: null }],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots).toHaveLength(1);
    // The viewing_slots `.in("listing_id", [...])` call must receive exactly
    // one id even though LISTING_ID appeared in both owned and represented sets.
    const slotsOp = ops.find((o) => o.table === "viewing_slots");
    expect(slotsOp?.inValues).toHaveLength(1);
    expect(slotsOp?.inValues).toContain(LISTING_ID);
  });

  it("throws when the listing_agents query errors (no silent empty set)", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [
        { data: null, error: { message: "rls error on listing_agents" } },
      ],
    });

    await expect(getAgentViewingSlots(supabase, AGENT_ID)).rejects.toThrow(
      "Failed to fetch represented listings: rls error on listing_agents",
    );
  });

  it("throws when the owned-listings query errors (no silent empty set)", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: null, error: { message: "listings read denied" } }],
      listing_agents: [{ data: [], error: null }],
    });

    await expect(getAgentViewingSlots(supabase, AGENT_ID)).rejects.toThrow(
      "Failed to fetch owned listings: listings read denied",
    );
  });

  it("derives a human property_label from the embedded listing address", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewing_slots: [
        {
          data: [
            {
              id: SLOT_ID,
              listing_id: LISTING_ID,
              agent_id: AGENT_ID,
              start_time: "2027-03-29T10:00:00Z",
              end_time: "2027-03-29T10:30:00Z",
              status: "available",
              booked_by: null,
              notes: null,
              created_at: "2027-03-01T00:00:00Z",
              listings: {
                properties: {
                  title: "Charming 3-Bed Semi",
                  address_line1: "8 Primrose Hill Road",
                  city: "London",
                  postcode: "NW1 8YD",
                },
              },
            },
          ],
          error: null,
        },
      ],
      profiles: [{ data: [], error: null }],
    });

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots[0].property_label).toBe("8 Primrose Hill Road, NW1 8YD");
  });
});

// ---------------------------------------------------------------------------
// createViewingSlot — unchanged behavior, booked_by_name: null
// ---------------------------------------------------------------------------

describe("createViewingSlot", () => {
  it("inserts an available viewing_slots row", async () => {
    const { supabase, ops } = makeSimpleSupabase([
      {
        data: {
          id: SLOT_ID,
          listing_id: LISTING_ID,
          agent_id: AGENT_ID,
          start_time: "2027-03-29T10:00:00Z",
          end_time: "2027-03-29T10:30:00Z",
          status: "available",
          booked_by: null,
          notes: null,
          created_at: "2027-03-01T00:00:00Z",
        },
        error: null,
      },
    ]);

    const slot = await createViewingSlot(supabase, AGENT_ID, {
      property_id: LISTING_ID,
      start_time: "2027-03-29T10:00:00Z",
      end_time: "2027-03-29T10:30:00Z",
    });

    expect(ops[0].table).toBe("viewing_slots");
    expect(ops[0].insert).toMatchObject({
      agent_id: AGENT_ID,
      listing_id: LISTING_ID,
      type: "in_person",
      status: "available",
    });
    expect(slot.property_id).toBe(LISTING_ID);
    expect(slot.is_booked).toBe(false);
    expect(slot.booked_by_name).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateViewingSlot — unchanged behavior
// ---------------------------------------------------------------------------

describe("updateViewingSlot", () => {
  it("refuses a booked slot", async () => {
    const { supabase } = makeSimpleSupabase([{ data: { status: "booked" }, error: null }]);

    await expect(
      updateViewingSlot(supabase, SLOT_ID, AGENT_ID, { notes: "x" }),
    ).rejects.toThrow(/booked/i);
  });
});

// ---------------------------------------------------------------------------
// deleteViewingSlot — unchanged behavior
// ---------------------------------------------------------------------------

describe("deleteViewingSlot", () => {
  it("refuses a booked slot", async () => {
    const { supabase } = makeSimpleSupabase([{ data: { status: "booked" }, error: null }]);

    await expect(deleteViewingSlot(supabase, SLOT_ID, AGENT_ID)).rejects.toThrow(/booked/i);
  });

  it("removes an available slot from viewing_slots", async () => {
    const { supabase, ops } = makeSimpleSupabase([
      { data: { status: "available" }, error: null },
      { data: null, error: null },
    ]);

    await deleteViewingSlot(supabase, SLOT_ID, AGENT_ID);

    expect(ops.every((o) => o.table === "viewing_slots")).toBe(true);
    expect(ops.some((o) => o.deleted)).toBe(true);
  });
});
