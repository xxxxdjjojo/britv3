import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPendingViewingRequests } from "@/services/viewings/viewings-service";

const HOST_ID = "aaaa0001-0001-0001-0001-aaaaaaaaaaaa";
const LISTING_ID = "bbbb0002-0002-0002-0002-bbbbbbbbbbbb";
const VIEWING_ID = "cccc0003-0003-0003-0003-cccccccccccc";
const USER_ID = "dddd0004-0004-0004-0004-dddddddddddd";

// ---------------------------------------------------------------------------
// Mock builder — table-keyed FIFO queues, same pattern as agent-viewing-service
// ---------------------------------------------------------------------------

type Op = {
  table: string;
  eq: Array<[string, unknown]>;
  inValues?: unknown[];
};

function makeSupabase(
  tableResults: Record<string, Array<{ data: unknown; error: unknown }>>,
) {
  const ops: Op[] = [];

  const next = (table: string) => {
    const queue = tableResults[table];
    return queue?.shift() ?? { data: [], error: null };
  };

  const from = vi.fn((table: string) => {
    const op: Op = { table, eq: [] };
    ops.push(op);
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
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

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// getPendingViewingRequests — error propagation (the critical fix)
// ---------------------------------------------------------------------------

describe("getPendingViewingRequests — error propagation", () => {
  it("throws when the listing_agents query errors (no silent empty set)", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [
        { data: null, error: { message: "rls denied on listing_agents" } },
      ],
    });

    await expect(getPendingViewingRequests(supabase, HOST_ID)).rejects.toThrow(
      "Failed to fetch represented listings: rls denied on listing_agents",
    );
  });

  it("throws when the owned-listings query errors (no silent empty set)", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: null, error: { message: "listings unavailable" } }],
      listing_agents: [{ data: [], error: null }],
    });

    await expect(getPendingViewingRequests(supabase, HOST_ID)).rejects.toThrow(
      "Failed to fetch owned listings: listings unavailable",
    );
  });

  it("throws when the viewings query errors", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewings: [{ data: null, error: { message: "viewings table down" } }],
    });

    await expect(getPendingViewingRequests(supabase, HOST_ID)).rejects.toThrow(
      "Failed to fetch pending viewing requests: viewings table down",
    );
  });

  it("returns [] when no listings are in scope", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [], error: null }],
      listing_agents: [{ data: [], error: null }],
    });

    const result = await getPendingViewingRequests(supabase, HOST_ID);

    expect(result).toEqual([]);
  });

  it("returns [] when there are no pending viewings", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewings: [{ data: [], error: null }],
    });

    const result = await getPendingViewingRequests(supabase, HOST_ID);

    expect(result).toEqual([]);
  });

  it("returns shaped PendingViewingRequest rows on success", async () => {
    const { supabase } = makeSupabase({
      listings: [{ data: [{ id: LISTING_ID }], error: null }],
      listing_agents: [{ data: [], error: null }],
      viewings: [
        {
          data: [
            {
              id: VIEWING_ID,
              listing_id: LISTING_ID,
              preferred_time: "2027-04-01T10:00:00Z",
              notes: "ground floor please",
              created_at: "2027-03-01T00:00:00Z",
              user_id: USER_ID,
            },
          ],
          error: null,
        },
      ],
      // resolveListingAddresses queries listings
      properties: [{ data: [], error: null }],
      profiles: [
        { data: [{ id: USER_ID, display_name: "Alice Buyer" }], error: null },
      ],
    });

    const result = await getPendingViewingRequests(supabase, HOST_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(VIEWING_ID);
    expect(result[0].listing_id).toBe(LISTING_ID);
    expect(result[0].requester_name).toBe("Alice Buyer");
  });
});
