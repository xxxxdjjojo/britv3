/**
 * Failure-mode tests for the billing_events idempotency helpers (PR 12 backfill).
 *
 * These helpers are the idempotency spine shared by the Stripe webhook route
 * and the DLQ replay function. The route-level tests already cover dispatch
 * behaviour; this file pins the helper contract itself plus the double-claim
 * semantics of the claim_billing_event RPC so a regression in either surfaces
 * here rather than as a double-charged customer.
 *
 * The RPC runs in Postgres, so its concurrency behaviour is asserted two ways:
 *  1. Helper unit tests with a mocked RPC (runs in CI, no DB required).
 *  2. A migration-contract assertion that the SQL still encodes
 *     `should_process = (status <> 'processed')` and preserves an already
 *     'processed' row on conflict — the actual double-claim guard.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  claimBillingEvent,
  markBillingEventProcessed,
  markBillingEventFailed,
} from "@/services/billing/billing-events";

type MockEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

function makeEvent(id = "evt_test_1"): MockEvent {
  return { id, type: "customer.subscription.updated", data: { object: { foo: "bar" } } };
}

/** Minimal Supabase double whose .rpc(...).maybeSingle() is scriptable. */
function makeSupabase(rpcResult: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(rpcResult);
  const rpc = vi.fn(() => ({ maybeSingle }));
  return { supabase: { rpc } as never, rpc, maybeSingle };
}

/** Supabase double for the void-returning RPCs (no maybeSingle). */
function makeVoidSupabase(rpcResult: { error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  return { supabase: { rpc } as never, rpc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 1. claimBillingEvent — helper contract
// ---------------------------------------------------------------------------

describe("claimBillingEvent", () => {
  it("first claim of a fresh event returns should_process=true", async () => {
    const { supabase, rpc } = makeSupabase({
      data: { status: "processing", should_process: true },
      error: null,
    });

    const claim = await claimBillingEvent(supabase, makeEvent() as never);

    expect(claim.should_process).toBe(true);
    expect(rpc).toHaveBeenCalledWith("claim_billing_event", {
      p_stripe_event_id: "evt_test_1",
      p_event_type: "customer.subscription.updated",
      p_payload: { foo: "bar" },
    });
  });

  it("re-claim of an already-processed event returns should_process=false (idempotent)", async () => {
    const { supabase } = makeSupabase({
      data: { status: "processed", should_process: false },
      error: null,
    });

    const claim = await claimBillingEvent(supabase, makeEvent() as never);

    // The duplicate signal the route relies on to skip re-dispatch.
    expect(claim.status).toBe("processed");
    expect(claim.should_process).toBe(false);
  });

  it("re-claim of a still-processing (failed mid-flight) event returns should_process=true", async () => {
    const { supabase } = makeSupabase({
      data: { status: "processing", should_process: true },
      error: null,
    });

    const claim = await claimBillingEvent(supabase, makeEvent() as never);

    expect(claim.should_process).toBe(true);
  });

  it("throws when the RPC errors so the caller can 500 and let Stripe retry", async () => {
    const { supabase } = makeSupabase({
      data: null,
      error: { message: "deadlock detected" },
    });

    await expect(claimBillingEvent(supabase, makeEvent() as never)).rejects.toThrow(
      /Failed to claim billing event/,
    );
  });

  it("throws when the RPC returns no row (should never happen — treated as failure)", async () => {
    const { supabase } = makeSupabase({ data: null, error: null });

    await expect(claimBillingEvent(supabase, makeEvent() as never)).rejects.toThrow(
      /no row returned/,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. mark helpers
// ---------------------------------------------------------------------------

describe("markBillingEventProcessed", () => {
  it("throws on RPC error so a failed completion write is not silently lost", async () => {
    const { supabase } = makeVoidSupabase({ error: { message: "write failed" } });

    await expect(
      markBillingEventProcessed(supabase, makeEvent() as never, "user_1"),
    ).rejects.toThrow(/Failed to mark billing event processed/);
  });
});

describe("markBillingEventFailed", () => {
  it("swallows RPC errors (already on a failure path — must not throw)", async () => {
    const { supabase } = makeVoidSupabase({ error: { message: "write failed" } });

    await expect(
      markBillingEventFailed(supabase, makeEvent() as never, new Error("boom")),
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. claim_billing_event SQL — the actual double-claim guard
// ---------------------------------------------------------------------------

describe("claim_billing_event migration contract", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260516000000_phase_a_billing_and_offer_safety.sql",
    ),
    "utf8",
  );

  it("returns should_process = (status <> 'processed')", () => {
    // The whole idempotency guarantee compresses to this one predicate.
    expect(sql).toMatch(/event_status\s*<>\s*'processed'/);
  });

  it("preserves an already-processed row on conflict instead of re-processing", () => {
    // ON CONFLICT keeps status='processed' when it was already processed.
    expect(sql).toMatch(/ON CONFLICT \(stripe_event_id\) DO UPDATE/i);
    expect(sql).toMatch(/WHEN public\.billing_events\.status = 'processed' THEN 'processed'/);
  });

  it("increments attempt_count on every re-claim (observability for stuck events)", () => {
    expect(sql).toMatch(/attempt_count = public\.billing_events\.attempt_count \+ 1/);
  });

  it("is executable only by service_role (webhook writes bypass RLS safely)", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.claim_billing_event/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.claim_billing_event.*TO service_role/);
  });
});
