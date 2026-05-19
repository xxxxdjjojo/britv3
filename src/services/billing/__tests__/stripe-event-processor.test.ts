/**
 * Tests for processStripeEvent — the shared dispatcher used by both the
 * Stripe webhook route and the DLQ replay function.
 *
 * Scope (per Sprint 0 Stream B): branch routing, throw-on-DB-failure, and
 * the unhandled-type no-op. Stream D will add per-branch coverage.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// next/cache: no-op revalidateTag inside tests.
// ---------------------------------------------------------------------------

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

// ---------------------------------------------------------------------------
// referrals dependency — keep it inert; the unrelated branches don't touch
// referrals at all.
// ---------------------------------------------------------------------------

vi.mock("@/services/referrals/unified-referral-service", () => ({
  advanceReferralStatus: vi.fn().mockResolvedValue(null),
}));

// ---------------------------------------------------------------------------
// SUT imported after mocks
// ---------------------------------------------------------------------------

import { processStripeEvent } from "../stripe-event-processor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EqResult = { data: unknown; error: { message: string } | null };

/**
 * Build a minimal Supabase mock that records the table touched and what the
 * final `eq(...)` (or `.maybeSingle()`) call resolves to.
 *
 * Each `from()` invocation pulls the next pre-queued result off the array.
 * Anything not queued resolves to `{ data: null, error: null }`.
 */
function makeSupabaseMock(results: EqResult[] = []) {
  const calls: { table: string }[] = [];
  let cursor = 0;

  function nextResult(): EqResult {
    const r = results[cursor];
    cursor += 1;
    return r ?? { data: null, error: null };
  }

  function makeBuilder() {
    const builder: Record<string, unknown> = {};
    const chainable = [
      "select",
      "insert",
      "update",
      "upsert",
      "delete",
      "eq",
      "neq",
      "order",
      "range",
      "limit",
      "offset",
    ];
    for (const m of chainable) {
      builder[m] = vi.fn(() => builder);
    }
    builder["single"] = vi.fn().mockImplementation(() => Promise.resolve(nextResult()));
    builder["maybeSingle"] = vi.fn().mockImplementation(() => Promise.resolve(nextResult()));
    builder["then"] = vi.fn((resolve: (v: EqResult) => unknown) => resolve(nextResult()));
    return builder;
  }

  const from = vi.fn((table: string) => {
    calls.push({ table });
    return makeBuilder();
  });

  return {
    client: { from, auth: { admin: { updateUserById: vi.fn().mockResolvedValue({}) } } } as unknown as SupabaseClient,
    calls,
  };
}

const stripeStub = {} as unknown as Stripe;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("processStripeEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches customer.subscription.deleted to the cancel branch", async () => {
    const { client, calls } = makeSupabaseMock([
      // 1. update subscriptions → no error
      { data: null, error: null },
      // 2. select subscription user_id (for force_refresh) → no user found
      { data: null, error: null },
    ]);

    const event = {
      id: "evt_test_001",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123", customer: "cus_123" } },
    } as unknown as Stripe.Event;

    const result = await processStripeEvent(client, stripeStub, event);

    expect(result).toEqual({ userId: null });
    // Both "subscriptions" reads/writes are recorded.
    expect(calls.some((c) => c.table === "subscriptions")).toBe(true);
  });

  it("throws when subscriptions update fails (DB error path)", async () => {
    const { client } = makeSupabaseMock([
      // First .eq()/awaited update on subscriptions returns an error.
      { data: null, error: { message: "deadlock detected" } },
    ]);

    const event = {
      id: "evt_test_002",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_456", customer: "cus_456" } },
    } as unknown as Stripe.Event;

    await expect(processStripeEvent(client, stripeStub, event)).rejects.toThrow(
      /Failed to cancel subscription: deadlock detected/,
    );
  });

  it("returns without throwing for unhandled event types", async () => {
    const { client, calls } = makeSupabaseMock();

    const event = {
      id: "evt_test_003",
      type: "invoice.upcoming",
      data: { object: { id: "in_999" } },
    } as unknown as Stripe.Event;

    const result = await processStripeEvent(client, stripeStub, event);

    expect(result).toEqual({ userId: null });
    // No table accessed for unhandled types.
    expect(calls.length).toBe(0);
  });
});
