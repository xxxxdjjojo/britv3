import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assignAgent,
  removeAgent,
  getRepresentedListings,
  getListingAgents,
  resolveAgentListingIds,
} from "@/services/listings/listing-agents-service";

const LISTING_ID = "aaaa0001-0001-0001-0001-aaaaaaaaaaaa";
const AGENT_ID = "bbbb0002-0002-0002-0002-bbbbbbbbbbbb";
const OWNER_ID = "cccc0003-0003-0003-0003-cccccccccccc";

type Op = {
  table: string;
  select?: string;
  insert?: unknown;
  update?: unknown;
  eq: Array<[string, unknown]>;
};

/**
 * Build a supabase mock whose from() returns a chainable builder.
 * `results` is a FIFO queue: each terminal call shifts the next result.
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
      eq: vi.fn((c: string, v: unknown) => {
        op.eq.push([c, v]);
        return builder;
      }),
      in: vi.fn(() => builder),
      order: vi.fn(async () => next()),
      single: vi.fn(async () => next()),
      // Awaiting the builder directly (no terminal method) resolves via then
      then: vi.fn((resolve: (v: unknown) => void) => resolve(next())),
    };
    return builder;
  });
  return { supabase: { from } as never, ops };
}

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// assignAgent
// ---------------------------------------------------------------------------

describe("assignAgent", () => {
  it("inserts a row with status active and the correct columns", async () => {
    const { supabase, ops } = makeSupabase([{ data: null, error: null }]);

    await assignAgent(supabase, {
      listingId: LISTING_ID,
      agentId: AGENT_ID,
      createdBy: OWNER_ID,
    });

    expect(ops[0].table).toBe("listing_agents");
    expect(ops[0].insert).toMatchObject({
      listing_id: LISTING_ID,
      agent_id: AGENT_ID,
      created_by: OWNER_ID,
      status: "active",
    });
  });

  it("swallows a 23505 unique-violation as idempotent success", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { code: "23505", message: "duplicate key" } },
    ]);

    await expect(
      assignAgent(supabase, {
        listingId: LISTING_ID,
        agentId: AGENT_ID,
        createdBy: OWNER_ID,
      }),
    ).resolves.toBeUndefined();
  });

  it("throws a friendly error on RLS denial (42501)", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { code: "42501", message: "permission denied" } },
    ]);

    await expect(
      assignAgent(supabase, {
        listingId: LISTING_ID,
        agentId: AGENT_ID,
        createdBy: OWNER_ID,
      }),
    ).rejects.toThrow("Only the listing owner can assign an agent");
  });

  it("rethrows unexpected errors with the DB message", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { code: "99999", message: "something else" } },
    ]);

    await expect(
      assignAgent(supabase, {
        listingId: LISTING_ID,
        agentId: AGENT_ID,
        createdBy: OWNER_ID,
      }),
    ).rejects.toThrow("something else");
  });
});

// ---------------------------------------------------------------------------
// removeAgent
// ---------------------------------------------------------------------------

describe("removeAgent", () => {
  it("issues an update with status removed and an updated_at timestamp", async () => {
    const { supabase, ops } = makeSupabase([{ data: null, error: null }]);

    await removeAgent(supabase, { listingId: LISTING_ID, agentId: AGENT_ID });

    expect(ops[0].table).toBe("listing_agents");
    expect(ops[0].update).toMatchObject({ status: "removed" });
    expect(typeof (ops[0].update as Record<string, unknown>)["updated_at"]).toBe("string");
    expect(ops[0].eq).toContainEqual(["listing_id", LISTING_ID]);
    expect(ops[0].eq).toContainEqual(["agent_id", AGENT_ID]);
    expect(ops[0].eq).toContainEqual(["status", "active"]);
  });

  it("throws a friendly owner-denial error on RLS denial (42501)", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { code: "42501", message: "permission denied" } },
    ]);

    await expect(
      removeAgent(supabase, { listingId: LISTING_ID, agentId: AGENT_ID }),
    ).rejects.toThrow("Only the listing owner can assign an agent");
  });

  it("rethrows unexpected errors with the DB message", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { code: "99999", message: "something else" } },
    ]);

    await expect(
      removeAgent(supabase, { listingId: LISTING_ID, agentId: AGENT_ID }),
    ).rejects.toThrow("something else");
  });
});

// ---------------------------------------------------------------------------
// getRepresentedListings
// ---------------------------------------------------------------------------

describe("getRepresentedListings", () => {
  it("returns an array of listing ids for active representations", async () => {
    const { supabase, ops } = makeSupabase([
      {
        data: [
          { listing_id: "list-1" },
          { listing_id: "list-2" },
        ],
        error: null,
      },
    ]);

    const ids = await getRepresentedListings(supabase, AGENT_ID);

    expect(ops[0].table).toBe("listing_agents");
    expect(ops[0].eq).toContainEqual(["agent_id", AGENT_ID]);
    expect(ops[0].eq).toContainEqual(["status", "active"]);
    expect(ids).toEqual(["list-1", "list-2"]);
  });

  it("returns empty array when no active representations", async () => {
    const { supabase } = makeSupabase([{ data: [], error: null }]);

    const ids = await getRepresentedListings(supabase, AGENT_ID);

    expect(ids).toEqual([]);
  });

  it("returns empty array on null data", async () => {
    const { supabase } = makeSupabase([{ data: null, error: null }]);

    const ids = await getRepresentedListings(supabase, AGENT_ID);

    expect(ids).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getListingAgents
// ---------------------------------------------------------------------------

describe("getListingAgents", () => {
  it("returns agent ids with display names joined from a second profiles query", async () => {
    // First result: listing_agents rows; second: profiles lookup
    const { supabase } = makeSupabase([
      {
        data: [
          { agent_id: AGENT_ID, created_at: "2025-01-01T00:00:00Z" },
        ],
        error: null,
      },
      {
        data: [{ id: AGENT_ID, display_name: "Jane Smith" }],
        error: null,
      },
    ]);

    const agents = await getListingAgents(supabase, LISTING_ID);

    expect(agents).toHaveLength(1);
    expect(agents[0]).toEqual({
      agent_id: AGENT_ID,
      display_name: "Jane Smith",
      created_at: "2025-01-01T00:00:00Z",
    });
  });

  it("returns null display_name when profile is not found", async () => {
    const { supabase } = makeSupabase([
      {
        data: [{ agent_id: AGENT_ID, created_at: "2025-01-01T00:00:00Z" }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const agents = await getListingAgents(supabase, LISTING_ID);

    expect(agents[0].display_name).toBeNull();
  });

  it("returns empty array when there are no active agents for the listing", async () => {
    const { supabase } = makeSupabase([{ data: [], error: null }]);

    const agents = await getListingAgents(supabase, LISTING_ID);

    expect(agents).toEqual([]);
  });

  it("throws when the listing_agents query errors", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { message: "db unavailable" } },
    ]);

    await expect(getListingAgents(supabase, LISTING_ID)).rejects.toThrow(
      "Failed to fetch listing agents: db unavailable",
    );
  });

  it("throws when the profiles query errors", async () => {
    const { supabase } = makeSupabase([
      { data: [{ agent_id: AGENT_ID, created_at: "2025-01-01T00:00:00Z" }], error: null },
      { data: null, error: { message: "profiles table down" } },
    ]);

    await expect(getListingAgents(supabase, LISTING_ID)).rejects.toThrow(
      "Failed to fetch agent profiles: profiles table down",
    );
  });
});

// ---------------------------------------------------------------------------
// getRepresentedListings — error propagation
// ---------------------------------------------------------------------------

describe("getRepresentedListings — error propagation", () => {
  it("throws when the listing_agents query errors", async () => {
    const { supabase } = makeSupabase([
      { data: null, error: { message: "connection refused" } },
    ]);

    await expect(getRepresentedListings(supabase, AGENT_ID)).rejects.toThrow(
      "Failed to fetch represented listings: connection refused",
    );
  });
});

// ---------------------------------------------------------------------------
// resolveAgentListingIds — new shared helper
// ---------------------------------------------------------------------------

/**
 * Table-keyed mock for resolveAgentListingIds which queries two tables in
 * parallel (listings + listing_agents).
 */
function makeTableSupabase(
  tableResults: Record<string, Array<{ data: unknown; error: unknown }>>,
) {
  const ops: Array<{ table: string; eq: Array<[string, unknown]>; inValues?: unknown[] }> = [];

  const next = (table: string) => {
    const queue = tableResults[table];
    return queue?.shift() ?? { data: [], error: null };
  };

  const from = vi.fn((table: string) => {
    const op = { table, eq: [] as Array<[string, unknown]>, inValues: undefined as unknown[] | undefined };
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
      order: vi.fn(async () => next(table)),
      single: vi.fn(async () => next(table)),
      then: vi.fn((resolve: (v: unknown) => void) => resolve(next(table))),
    };
    return builder;
  });

  return { supabase: { from } as never, ops };
}

describe("resolveAgentListingIds", () => {
  it("returns deduped union of owned and represented listing ids", async () => {
    const { supabase } = makeTableSupabase({
      listings: [{ data: [{ id: "list-A" }, { id: "list-B" }], error: null }],
      listing_agents: [{ data: [{ listing_id: "list-B" }, { listing_id: "list-C" }], error: null }],
    });

    const ids = await resolveAgentListingIds(supabase, AGENT_ID);

    // list-B appears in both — dedup means it appears once
    expect(ids).toHaveLength(3);
    expect(ids).toContain("list-A");
    expect(ids).toContain("list-B");
    expect(ids).toContain("list-C");
    // Verify no duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("throws when the owned-listings query errors", async () => {
    const { supabase } = makeTableSupabase({
      listings: [{ data: null, error: { message: "listings table error" } }],
      listing_agents: [{ data: [], error: null }],
    });

    await expect(resolveAgentListingIds(supabase, AGENT_ID)).rejects.toThrow(
      "Failed to fetch owned listings: listings table error",
    );
  });

  it("throws when the listing_agents query errors", async () => {
    const { supabase } = makeTableSupabase({
      listings: [{ data: [], error: null }],
      listing_agents: [{ data: null, error: { message: "rls denied" } }],
    });

    await expect(resolveAgentListingIds(supabase, AGENT_ID)).rejects.toThrow(
      "Failed to fetch represented listings: rls denied",
    );
  });

  it("returns empty array when agent owns and represents nothing", async () => {
    const { supabase } = makeTableSupabase({
      listings: [{ data: [], error: null }],
      listing_agents: [{ data: [], error: null }],
    });

    const ids = await resolveAgentListingIds(supabase, AGENT_ID);

    expect(ids).toEqual([]);
  });
});
