/**
 * Tests for the admin verification-service per-reference review additions.
 *
 * Uses the repo's chainable Supabase mock pattern. No real DB. The audit logger
 * is intentionally NOT exercised here — reviewReference only does the DB write +
 * validation; auditing is the API route's job (T9).
 */

import { describe, expect, it, vi } from "vitest";

import {
  getProviderReferencesForAdmin,
  reviewReference,
} from "./verification-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Captured = { update?: unknown; order?: { column: string; opts: unknown } };

function makeChain(resolveValue: unknown, captured?: Captured) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  if (captured) {
    chain["update"] = vi.fn((payload: unknown) => {
      captured.update = payload;
      return chain;
    });
    chain["order"] = vi.fn((column: string, opts: unknown) => {
      captured.order = { column, opts };
      return chain;
    });
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  return chain;
}

function clientFrom(chain: Record<string, unknown>) {
  return { from: vi.fn(() => chain) } as unknown as Parameters<
    typeof getProviderReferencesForAdmin
  >[0];
}

/**
 * Two-query client: first from() = fetch chain, second = update chain.
 * The update chain ends in `.select("id")`, so its default success value is a
 * one-row array (the row that was updated). Pass `{ data: [], error: null }`
 * to simulate a 0-rows update (concurrent double-review → invalid_state).
 */
function makeReviewClient(
  row: unknown,
  captured: Captured,
  updateResult: { data: unknown; error: { message: string } | null } = {
    data: [{ id: "ref-1" }],
    error: null,
  },
) {
  const fetchChain = makeChain({ data: row, error: null });
  const updateChain = makeChain(updateResult, captured);
  let call = 0;
  return {
    from: vi.fn(() => {
      call += 1;
      return call === 1 ? fetchChain : updateChain;
    }),
  } as unknown as Parameters<typeof reviewReference>[0];
}

// ---------------------------------------------------------------------------
// getProviderReferencesForAdmin
// ---------------------------------------------------------------------------

describe("getProviderReferencesForAdmin", () => {
  it("returns the rows for the provider, newest request first", async () => {
    const rows = [
      { id: "ref-1", reference_type: "client", status: "submitted", referee_email: "a@example.com" },
      { id: "ref-2", reference_type: "peer", status: "verified", referee_email: "b@example.com" },
    ];
    const captured: Captured = {};
    const chain = makeChain({ data: rows, error: null }, captured);
    const result = await getProviderReferencesForAdmin(clientFrom(chain), "prov-1");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("ref-1");
    // Newest request first — protects the admin queue ordering.
    expect(captured.order).toEqual({ column: "requested_at", opts: { ascending: false } });
  });

  it("returns an empty array on a query error", async () => {
    const chain = makeChain({ data: null, error: { message: "boom" } });
    const result = await getProviderReferencesForAdmin(clientFrom(chain), "prov-1");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// reviewReference
// ---------------------------------------------------------------------------

describe("reviewReference", () => {
  const now = new Date("2026-07-12T12:00:00Z");

  it("verify from submitted -> verified + verified_at + reviewed fields", async () => {
    const captured: Captured = {};
    const client = makeReviewClient(
      { id: "ref-1", status: "submitted" },
      captured,
    );
    const result = await reviewReference(
      client,
      { referenceId: "ref-1", decision: "verify", adminId: "admin-1" },
      now,
    );
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.status).toBe("verified");
    expect(payload.verified_at).toBe(now.toISOString());
    expect(payload.reviewed_at).toBe(now.toISOString());
    expect(payload.reviewed_by).toBe("admin-1");
  });

  it("verify does not require a reason", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "submitted" }, captured);
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "verify",
      adminId: "admin-1",
    });
    expect(result).toEqual({ success: true });
  });

  it("reject without a reason -> reason_required", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "submitted" }, captured);
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "reject",
      adminId: "admin-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "reason_required" }),
    );
  });

  it("reject with a reason -> rejected + review_reason set", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "submitted" }, captured);
    const result = await reviewReference(
      client,
      { referenceId: "ref-1", decision: "reject", reason: "fake email", adminId: "admin-1" },
      now,
    );
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.status).toBe("rejected");
    expect(payload.review_reason).toBe("fake email");
    expect(payload.verified_at).toBeUndefined();
  });

  it("flag with a reason -> flagged", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "submitted" }, captured);
    const result = await reviewReference(
      client,
      { referenceId: "ref-1", decision: "flag", reason: "needs a look", adminId: "admin-1" },
      now,
    );
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.status).toBe("flagged");
  });

  it("flag without a reason -> reason_required", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "submitted" }, captured);
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "flag",
      adminId: "admin-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "reason_required" }),
    );
  });

  it("can review a previously-flagged reference", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "flagged" }, captured);
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "verify",
      adminId: "admin-1",
    });
    expect(result).toEqual({ success: true });
  });

  it("returns invalid_state for a pending reference", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "pending" }, captured);
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "verify",
      adminId: "admin-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "invalid_state" }),
    );
  });

  it("returns invalid_state for an already-verified reference", async () => {
    const captured: Captured = {};
    const client = makeReviewClient({ id: "ref-1", status: "verified" }, captured);
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "reject",
      reason: "changed my mind",
      adminId: "admin-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "invalid_state" }),
    );
  });

  it("returns not_found when the row does not exist", async () => {
    const captured: Captured = {};
    const client = makeReviewClient(null, captured);
    const result = await reviewReference(client, {
      referenceId: "missing",
      decision: "verify",
      adminId: "admin-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "not_found" }),
    );
  });

  it("returns a generic error (not the raw supabase message) on an update error", async () => {
    const captured: Captured = {};
    const client = makeReviewClient(
      { id: "ref-1", status: "submitted" },
      captured,
      { data: null, error: { message: "update boom" } },
    );
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "verify",
      adminId: "admin-1",
    });
    // Fix 1: raw supabase error.message must NOT leak to the caller.
    expect(result).toEqual({ success: false, error: "Failed to save decision" });
  });

  it("returns invalid_state when the guarded UPDATE matches 0 rows (concurrent review)", async () => {
    // Fix 2: status guard read said 'submitted', but a concurrent admin already
    // moved it on, so the status-filtered UPDATE affects 0 rows.
    const captured: Captured = {};
    const client = makeReviewClient(
      { id: "ref-1", status: "submitted" },
      captured,
      { data: [], error: null },
    );
    const result = await reviewReference(client, {
      referenceId: "ref-1",
      decision: "verify",
      adminId: "admin-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "invalid_state" }),
    );
  });
});
