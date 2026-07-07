import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAgentViewingSlots,
  createViewingSlot,
  updateViewingSlot,
  deleteViewingSlot,
} from "@/services/agent/agent-viewing-service";

const AGENT_ID = "33333333-3333-3333-3333-333333333333";
const LISTING_ID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";
const SLOT_ID = "a5156744-782c-4b28-8a92-b7389f1774d0";

type Op = { table: string; select?: string; insert?: unknown; update?: unknown; eq: Array<[string, unknown]>; deleted?: boolean };

/**
 * Build a supabase mock whose from() returns a chainable builder. `results` is
 * a FIFO queue: each terminal (.order / .single) shifts the next result. All
 * ops are recorded on `ops`.
 */
function makeSupabase(results: Array<{ data: unknown; error: unknown }>) {
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

describe("agent-viewing-service — unified on viewing_slots", () => {
  it("getAgentViewingSlots reads viewing_slots and maps to the legacy shape", async () => {
    const { supabase, ops } = makeSupabase([
      {
        data: [
          {
            id: SLOT_ID,
            listing_id: LISTING_ID,
            agent_id: AGENT_ID,
            start_time: "2027-03-29T10:00:00Z",
            end_time: "2027-03-29T10:30:00Z",
            status: "booked",
            booked_by: "buyer-1",
            notes: "front door",
            created_at: "2027-03-01T00:00:00Z",
          },
        ],
        error: null,
      },
    ]);

    const slots = await getAgentViewingSlots(supabase, AGENT_ID, LISTING_ID);

    expect(ops[0].table).toBe("viewing_slots");
    expect(ops[0].eq).toContainEqual(["agent_id", AGENT_ID]);
    expect(ops[0].eq).toContainEqual(["listing_id", LISTING_ID]);
    expect(slots[0].property_id).toBe(LISTING_ID);
    expect(slots[0].is_booked).toBe(true);
    expect(slots[0].booked_by).toBe("buyer-1");
  });

  it("getAgentViewingSlots derives a human property_label from the embedded listing address", async () => {
    const { supabase } = makeSupabase([
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
                title: "Charming 3-Bed Semi in Primrose Hill",
                address_line1: "8 Primrose Hill Road",
                city: "London",
                postcode: "NW1 8YD",
              },
            },
          },
        ],
        error: null,
      },
    ]);

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots[0].property_label).toBe("8 Primrose Hill Road, NW1 8YD");
  });

  it("getAgentViewingSlots falls back to null property_label when no listing address is present", async () => {
    const { supabase } = makeSupabase([
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
    ]);

    const slots = await getAgentViewingSlots(supabase, AGENT_ID);

    expect(slots[0].property_label).toBeNull();
  });

  it("createViewingSlot inserts an available viewing_slots row", async () => {
    const { supabase, ops } = makeSupabase([
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
  });

  it("updateViewingSlot refuses a booked slot", async () => {
    const { supabase } = makeSupabase([{ data: { status: "booked" }, error: null }]);

    await expect(
      updateViewingSlot(supabase, SLOT_ID, AGENT_ID, { notes: "x" }),
    ).rejects.toThrow(/booked/i);
  });

  it("deleteViewingSlot refuses a booked slot", async () => {
    const { supabase } = makeSupabase([{ data: { status: "booked" }, error: null }]);

    await expect(deleteViewingSlot(supabase, SLOT_ID, AGENT_ID)).rejects.toThrow(/booked/i);
  });

  it("deleteViewingSlot removes an available slot from viewing_slots", async () => {
    const { supabase, ops } = makeSupabase([
      { data: { status: "available" }, error: null }, // guard select
      { data: null, error: null }, // delete
    ]);

    await deleteViewingSlot(supabase, SLOT_ID, AGENT_ID);

    expect(ops.every((o) => o.table === "viewing_slots")).toBe(true);
    expect(ops.some((o) => o.deleted)).toBe(true);
  });
});
