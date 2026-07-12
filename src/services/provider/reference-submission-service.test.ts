/**
 * Tests for reference-submission-service (referee-side, token-authenticated).
 *
 * The referee is unauthenticated; the raw token IS the auth. Uses the repo's
 * chainable Supabase mock pattern. No real DB.
 */

import { describe, expect, it, vi } from "vitest";

import {
  declineReference,
  resolveInvitationByToken,
  submitReference,
} from "./reference-submission-service";
import { hashReferenceToken } from "@/lib/reference-tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Captured = { update?: unknown };

/**
 * Builds a chainable Supabase mock.
 *
 * `resolveValue` is what `single`/`maybeSingle` (the read path) resolves to.
 * `awaitValue` is what awaiting the chain directly (the write path, i.e. an
 * `update(...).…​.select("id")` that is `await`ed) resolves to. It defaults to
 * `resolveValue` for read-only chains. The submit/decline updates await the
 * chain and expect `{ data: affectedRows, error }`.
 */
function makeChain(resolveValue: unknown, captured?: Captured, awaitValue?: unknown) {
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
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  const terminal = awaitValue ?? resolveValue;
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    terminal,
  ).then.bind(Promise.resolve(terminal));
  return chain;
}

/**
 * Builds a client where:
 * - provider_references select resolves to `refRow`
 * - profiles select resolves to `profileRow`
 * - service_provider_details select resolves to `spdRow`
 * - provider_references update captures the payload
 */
function makeClient(opts: {
  refRow: unknown;
  profileRow?: unknown;
  spdRow?: unknown;
  captured?: Captured;
  /** Rows the terminal `update(...).select("id")` reports as affected. */
  affectedRows?: unknown[];
}) {
  const refChain = makeChain(
    { data: opts.refRow, error: null },
    opts.captured,
    { data: opts.affectedRows ?? [{ id: "ref-1" }], error: null },
  );
  const profileChain = makeChain({
    data: opts.profileRow ?? { display_name: "Ace Plumbing" },
    error: null,
  });
  const spdChain = makeChain({
    data: opts.spdRow ?? { services: ["plumber"], business_name: "Ace Plumbing Ltd" },
    error: null,
  });
  return {
    from: vi.fn((table: string) => {
      if (table === "provider_references") return refChain;
      if (table === "profiles") return profileChain;
      if (table === "service_provider_details") return spdChain;
      return refChain;
    }),
  } as unknown as Parameters<typeof resolveInvitationByToken>[0];
}

const RAW = "raw-token-abc";
const HASH = hashReferenceToken(RAW);
const FUTURE_EXPIRY = "2999-01-01T00:00:00Z";
const PAST_EXPIRY = "2000-01-01T00:00:00Z";

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "ref-1",
    provider_id: "prov-1",
    reference_type: "client",
    referee_name: "Jane Client",
    relationship: "Past client",
    status: "sent",
    invite_token_hash: HASH,
    invite_expires_at: FUTURE_EXPIRY,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// resolveInvitationByToken
// ---------------------------------------------------------------------------

describe("resolveInvitationByToken", () => {
  it("returns invalid when no row matches the token", async () => {
    const client = makeClient({ refRow: null });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("invalid");
  });

  it("returns invalid (not enumerable) when the invite was revoked", async () => {
    const client = makeClient({ refRow: validRow({ status: "revoked" }) });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("invalid");
  });

  it("returns declined when already declined", async () => {
    const client = makeClient({ refRow: validRow({ status: "declined" }) });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("declined");
  });

  it("returns used when already submitted", async () => {
    const client = makeClient({ refRow: validRow({ status: "submitted" }) });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("used");
  });

  it("returns expired and lazily writes status when past expiry", async () => {
    const captured: Captured = {};
    const client = makeClient({
      refRow: validRow({ invite_expires_at: PAST_EXPIRY }),
      captured,
    });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("expired");
    expect((captured.update as Record<string, unknown>).status).toBe("expired");
  });

  it("returns valid with provider displayName + requires_work_date true for client", async () => {
    const client = makeClient({ refRow: validRow() });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("valid");
    expect(result.reference?.requires_work_date).toBe(true);
    expect(result.provider?.displayName).toBe("Ace Plumbing");
    // trade derived from first service_category enum value, humanised via CATEGORY_LABELS
    expect(result.provider?.trade).toBe("Plumber");
  });

  it("falls back to business_name for the trade when the provider has no services", async () => {
    const client = makeClient({
      refRow: validRow(),
      spdRow: { services: [], business_name: "Handy Homes Ltd" },
    });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("valid");
    expect(result.provider?.trade).toBe("Handy Homes Ltd");
  });

  it("requires_work_date is false for peer references", async () => {
    const client = makeClient({
      refRow: validRow({ reference_type: "peer" }),
    });
    const result = await resolveInvitationByToken(client, RAW);
    expect(result.state).toBe("valid");
    expect(result.reference?.requires_work_date).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submitReference
// ---------------------------------------------------------------------------

describe("submitReference", () => {
  const goodText = "They did excellent work on my kitchen, on time and tidy.";

  it("returns proper state when not valid (submitted -> used)", async () => {
    const client = makeClient({ refRow: validRow({ status: "submitted" }) });
    const result = await submitReference(client, RAW, {
      reference_text: goodText,
      work_date: "2026-06-01",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, state: "used" }),
    );
  });

  it("rejects a client reference with no work_date", async () => {
    const client = makeClient({ refRow: validRow() });
    const result = await submitReference(client, RAW, {
      reference_text: goodText,
    });
    expect(result).toEqual(expect.objectContaining({ success: false }));
  });

  it("rejects a client reference with a future work_date", async () => {
    const now = new Date("2026-07-12T00:00:00Z");
    const client = makeClient({ refRow: validRow() });
    const result = await submitReference(
      client,
      RAW,
      { reference_text: goodText, work_date: "2027-01-01" },
      now,
    );
    expect(result).toEqual(expect.objectContaining({ success: false }));
  });

  it("happy path sets submitted, persists fields, and NULLs the token hash", async () => {
    const captured: Captured = {};
    const now = new Date("2026-07-12T12:00:00Z");
    const client = makeClient({ refRow: validRow(), captured });
    const result = await submitReference(
      client,
      RAW,
      { reference_text: goodText, work_date: "2026-06-01", rating: 5 },
      now,
    );
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.status).toBe("submitted");
    expect(payload.reference_text).toBe(goodText);
    expect(payload.work_date).toBe("2026-06-01");
    expect(payload.rating).toBe(5);
    expect(payload.invite_token_hash).toBeNull();
    expect(payload.submitted_at).toBe(now.toISOString());
  });

  it("allows a peer reference with no work_date", async () => {
    const captured: Captured = {};
    const client = makeClient({
      refRow: validRow({ reference_type: "peer" }),
      captured,
    });
    const result = await submitReference(client, RAW, {
      reference_text: goodText,
    });
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.invite_token_hash).toBeNull();
    expect("work_date" in payload).toBe(false);
  });

  it("rejects reference_text below the minimum length", async () => {
    const client = makeClient({ refRow: validRow({ reference_type: "peer" }) });
    const result = await submitReference(client, RAW, {
      reference_text: "too short",
    });
    expect(result).toEqual(expect.objectContaining({ success: false }));
  });

  it("returns state used when a concurrent submit already consumed the token (0 rows affected)", async () => {
    // The row still resolves as `valid` (both requests read it before either
    // commits), but the UPDATE matches 0 rows because the racing request already
    // NULLed invite_token_hash. The DB is the serialization point.
    const client = makeClient({ refRow: validRow(), affectedRows: [] });
    const result = await submitReference(client, RAW, {
      reference_text: goodText,
      work_date: "2026-06-01",
    });
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        state: "used",
        error: "This reference has already been submitted.",
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// declineReference
// ---------------------------------------------------------------------------

describe("declineReference", () => {
  it("valid -> declined and NULLs the token hash", async () => {
    const captured: Captured = {};
    const now = new Date("2026-07-12T12:00:00Z");
    const client = makeClient({ refRow: validRow(), captured });
    const result = await declineReference(client, RAW, "Not comfortable", now);
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.status).toBe("declined");
    expect(payload.declined_reason).toBe("Not comfortable");
    expect(payload.declined_at).toBe(now.toISOString());
    expect(payload.invite_token_hash).toBeNull();
  });

  it("returns an error when the invite is not valid", async () => {
    const client = makeClient({ refRow: validRow({ status: "submitted" }) });
    const result = await declineReference(client, RAW);
    expect(result).toEqual(expect.objectContaining({ success: false }));
  });
});
