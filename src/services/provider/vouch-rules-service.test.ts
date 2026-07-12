/**
 * Tests for vouch-rules-service (config + valid-vouch counting + gate eval).
 *
 * Uses the repo's chainable Supabase mock pattern. No real DB.
 */

import { describe, expect, it, vi } from "vitest";

import {
  countValidVouches,
  evaluateVouchGate,
  getVouchRules,
  VOUCH_RULES_DEFAULTS,
} from "./vouch-rules-service";
import type { VouchRules } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RULES: VouchRules = {
  id: true,
  required_peer_vouches: 3,
  required_client_vouches: 3,
  client_recency_days: 90,
  invite_expiry_days: 30,
  resend_cooldown_hours: 24,
  gate_enabled: false,
  updated_at: null,
  updated_by: null,
};

/**
 * Builds a chainable Supabase mock for a single logical query.
 * `single`/`maybeSingle` resolve to `resolveValue`, and the chain itself is
 * thenable (so `await supabase.from(...).select(...).eq(...)` resolves).
 */
function makeChain(resolveValue: unknown, capturedEq?: Array<[string, unknown]>) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  if (capturedEq) {
    chain["eq"] = vi.fn((column: string, value: unknown) => {
      capturedEq.push([column, value]);
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
  return { from: vi.fn(() => chain) } as unknown as Parameters<typeof getVouchRules>[0];
}

// ---------------------------------------------------------------------------
// getVouchRules
// ---------------------------------------------------------------------------

describe("getVouchRules", () => {
  it("returns the singleton row when present", async () => {
    const row = { ...RULES, required_peer_vouches: 2, gate_enabled: true };
    const chain = makeChain({ data: row, error: null });
    const result = await getVouchRules(clientFrom(chain));
    expect(result.required_peer_vouches).toBe(2);
    expect(result.gate_enabled).toBe(true);
  });

  it("returns hardcoded defaults on a query error", async () => {
    const chain = makeChain({ data: null, error: { message: "boom" } });
    const result = await getVouchRules(clientFrom(chain));
    expect(result).toEqual(VOUCH_RULES_DEFAULTS);
    expect(result.required_peer_vouches).toBe(3);
    expect(result.required_client_vouches).toBe(3);
    expect(result.client_recency_days).toBe(90);
    expect(result.invite_expiry_days).toBe(30);
    expect(result.resend_cooldown_hours).toBe(24);
    expect(result.gate_enabled).toBe(false);
  });

  it("returns hardcoded defaults when no row exists", async () => {
    const chain = makeChain({ data: null, error: null });
    const result = await getVouchRules(clientFrom(chain));
    expect(result).toEqual(VOUCH_RULES_DEFAULTS);
  });

  it("never throws even when the client itself throws", async () => {
    // Simulate the supabase client throwing synchronously inside the query.
    const client = {
      from: vi.fn(() => {
        throw new Error("network");
      }),
    } as unknown as Parameters<typeof getVouchRules>[0];
    const result = await getVouchRules(client);
    expect(result).toEqual(VOUCH_RULES_DEFAULTS);
  });
});

// ---------------------------------------------------------------------------
// countValidVouches
// ---------------------------------------------------------------------------

describe("countValidVouches", () => {
  // Fixed "now" so date math is deterministic. recency window = 90 days.
  const now = new Date("2026-07-12T12:00:00Z");
  // Boundary: now - 90 days = 2026-04-13 (DATE-only).
  const boundaryDate = "2026-04-13";
  const oneDayOlder = "2026-04-12";
  const insideWindow = "2026-06-01";

  function makeVerifiedRows(rows: Array<{ reference_type: string; work_date: string | null }>) {
    return makeChain({ data: rows, error: null });
  }

  it("counts only verified rows (ignores every other status)", async () => {
    // The service filters status='verified' at the query level, so the mock
    // returns only verified rows. This test confirms the peer/client split.
    const chain = makeVerifiedRows([
      { reference_type: "peer", work_date: null },
      { reference_type: "peer", work_date: null },
    ]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result).toEqual({ peer: 2, client: 0 });
  });

  it("applies the verified-only filter at the query level", async () => {
    // Regression guard: the mock's .eq is otherwise a no-op, so a future edit
    // dropping .eq("status","verified") would silently count every status.
    // Capture the .eq() calls and assert the verified filter is present.
    const capturedEq: Array<[string, unknown]> = [];
    const chain = makeChain({ data: [], error: null }, capturedEq);
    await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(capturedEq).toContainEqual(["status", "verified"]);
    expect(capturedEq).toContainEqual(["provider_id", "prov-1"]);
  });

  it("splits peer and client counts", async () => {
    const chain = makeVerifiedRows([
      { reference_type: "peer", work_date: null },
      { reference_type: "client", work_date: insideWindow },
      { reference_type: "client", work_date: insideWindow },
    ]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result).toEqual({ peer: 1, client: 2 });
  });

  it("counts a client vouch whose work_date is inside the recency window", async () => {
    const chain = makeVerifiedRows([{ reference_type: "client", work_date: insideWindow }]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result.client).toBe(1);
  });

  it("counts a client vouch exactly at the recency boundary (now - recency_days)", async () => {
    const chain = makeVerifiedRows([{ reference_type: "client", work_date: boundaryDate }]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result.client).toBe(1);
  });

  it("does NOT count a client vouch one day older than the boundary", async () => {
    const chain = makeVerifiedRows([{ reference_type: "client", work_date: oneDayOlder }]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result.client).toBe(0);
  });

  it("does NOT count a client vouch with a null work_date", async () => {
    const chain = makeVerifiedRows([{ reference_type: "client", work_date: null }]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result.client).toBe(0);
  });

  it("peer vouches ignore work_date entirely (null or old both count)", async () => {
    const chain = makeVerifiedRows([
      { reference_type: "peer", work_date: null },
      { reference_type: "peer", work_date: oneDayOlder },
    ]);
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result.peer).toBe(2);
  });

  it("returns zeros on a query error", async () => {
    const chain = makeChain({ data: null, error: { message: "boom" } });
    const result = await countValidVouches(clientFrom(chain), "prov-1", RULES, now);
    expect(result).toEqual({ peer: 0, client: 0 });
  });
});

// ---------------------------------------------------------------------------
// evaluateVouchGate (pure)
// ---------------------------------------------------------------------------

describe("evaluateVouchGate", () => {
  it("both below threshold -> nothing met", () => {
    const r = evaluateVouchGate({ peer: 2, client: 1 }, RULES);
    expect(r).toEqual({ peerMet: false, clientMet: false, allMet: false, gateEnabled: false });
  });

  it("exactly at threshold -> met", () => {
    const r = evaluateVouchGate({ peer: 3, client: 3 }, RULES);
    expect(r).toEqual({ peerMet: true, clientMet: true, allMet: true, gateEnabled: false });
  });

  it("above threshold -> met", () => {
    const r = evaluateVouchGate({ peer: 5, client: 9 }, RULES);
    expect(r).toEqual({ peerMet: true, clientMet: true, allMet: true, gateEnabled: false });
  });

  it("peer met, client short -> allMet false", () => {
    const r = evaluateVouchGate({ peer: 3, client: 2 }, RULES);
    expect(r.peerMet).toBe(true);
    expect(r.clientMet).toBe(false);
    expect(r.allMet).toBe(false);
  });

  it("passes gate_enabled through", () => {
    const r = evaluateVouchGate({ peer: 3, client: 3 }, { ...RULES, gate_enabled: true });
    expect(r.gateEnabled).toBe(true);
  });
});
