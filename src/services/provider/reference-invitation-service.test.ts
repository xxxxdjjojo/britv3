/**
 * Tests for reference-invitation-service (trader-side invitation lifecycle).
 *
 * Uses the repo's chainable Supabase mock pattern. No real DB.
 */

import { describe, expect, it, vi } from "vitest";

import {
  cancelReferenceInvitation,
  createReferenceInvitation,
  markSentReference,
  resendReferenceInvitation,
} from "./reference-invitation-service";
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

/** Records the payload passed to insert/update so tests can assert on it. */
type Captured = { insert?: unknown; update?: unknown };

/**
 * Builds a chainable Supabase mock for a single logical query.
 * `single`/`maybeSingle` resolve to `resolveValue`.
 */
function makeChain(resolveValue: unknown, captured?: Captured, kind?: "insert" | "update") {
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
    chain["insert"] = vi.fn((payload: unknown) => {
      captured.insert = payload;
      return chain;
    });
    chain["update"] = vi.fn((payload: unknown) => {
      captured.update = payload;
      return chain;
    });
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  void kind;
  return chain;
}

function clientFrom(chain: Record<string, unknown>) {
  return { from: vi.fn(() => chain) } as unknown as Parameters<
    typeof createReferenceInvitation
  >[0];
}

// ---------------------------------------------------------------------------
// createReferenceInvitation
// ---------------------------------------------------------------------------

describe("createReferenceInvitation", () => {
  const baseParams = {
    providerId: "prov-1",
    providerEmail: "trader@example.com",
    referee_name: "Jane Client",
    referee_email: "jane@example.com",
    reference_type: "client" as const,
  };

  it("happy path returns success + id and inserts a pending row with no token", async () => {
    const captured: Captured = {};
    const chain = makeChain({ data: { id: "ref-1" }, error: null }, captured);
    const result = await createReferenceInvitation(clientFrom(chain), baseParams);

    expect(result).toEqual({ success: true, id: "ref-1" });
    const payload = captured.insert as Record<string, unknown>;
    expect(payload.status).toBe("pending");
    expect(payload.provider_id).toBe("prov-1");
    expect(payload.referee_email).toBe("jane@example.com");
    expect("invite_token_hash" in payload).toBe(false);
  });

  it("rejects self-vouch (case-insensitive) with code self_vouch", async () => {
    const chain = makeChain({ data: { id: "x" }, error: null });
    const result = await createReferenceInvitation(clientFrom(chain), {
      ...baseParams,
      referee_email: "TRADER@example.com",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "self_vouch" }),
    );
  });

  it("maps a 23505 unique-violation to code duplicate", async () => {
    const chain = makeChain({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    const result = await createReferenceInvitation(clientFrom(chain), baseParams);
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "duplicate" }),
    );
  });

  it("rejects an invalid email with code invalid", async () => {
    const chain = makeChain({ data: null, error: null });
    const result = await createReferenceInvitation(clientFrom(chain), {
      ...baseParams,
      referee_email: "not-an-email",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "invalid" }),
    );
  });
});

// ---------------------------------------------------------------------------
// resendReferenceInvitation
// ---------------------------------------------------------------------------

describe("resendReferenceInvitation", () => {
  it("returns not_found when the row belongs to another provider", async () => {
    const chain = makeChain({
      data: {
        id: "ref-1",
        provider_id: "someone-else",
        status: "sent",
        invite_last_sent_at: null,
        invite_send_count: 1,
      },
      error: null,
    });
    const result = await resendReferenceInvitation(clientFrom(chain), {
      referenceId: "ref-1",
      providerId: "prov-1",
      rules: RULES,
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "not_found" }),
    );
  });

  it("returns not_resendable when status is submitted", async () => {
    const chain = makeChain({
      data: {
        id: "ref-1",
        provider_id: "prov-1",
        status: "submitted",
        invite_last_sent_at: null,
        invite_send_count: 1,
      },
      error: null,
    });
    const result = await resendReferenceInvitation(clientFrom(chain), {
      referenceId: "ref-1",
      providerId: "prov-1",
      rules: RULES,
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "not_resendable" }),
    );
  });

  it("returns cooldown when within the resend window", async () => {
    const lastSent = new Date("2026-07-12T10:00:00Z").toISOString();
    const now = new Date("2026-07-12T20:00:00Z"); // 10h later, cooldown is 24h
    const chain = makeChain({
      data: {
        id: "ref-1",
        provider_id: "prov-1",
        status: "sent",
        invite_last_sent_at: lastSent,
        invite_send_count: 1,
      },
      error: null,
    });
    const result = await resendReferenceInvitation(
      clientFrom(chain),
      { referenceId: "ref-1", providerId: "prov-1", rules: RULES },
      now,
    );
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "cooldown" }),
    );
  });

  it("returns max_sends at send count 5", async () => {
    const chain = makeChain({
      data: {
        id: "ref-1",
        provider_id: "prov-1",
        status: "sent",
        invite_last_sent_at: null,
        invite_send_count: 5,
      },
      error: null,
    });
    const result = await resendReferenceInvitation(clientFrom(chain), {
      referenceId: "ref-1",
      providerId: "prov-1",
      rules: RULES,
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "max_sends" }),
    );
  });

  it("returns success when eligible (cooldown elapsed, under max, pending)", async () => {
    const lastSent = new Date("2026-07-10T10:00:00Z").toISOString();
    const now = new Date("2026-07-12T10:00:00Z"); // 48h later
    const chain = makeChain({
      data: {
        id: "ref-1",
        provider_id: "prov-1",
        status: "pending",
        invite_last_sent_at: lastSent,
        invite_send_count: 1,
      },
      error: null,
    });
    const result = await resendReferenceInvitation(
      clientFrom(chain),
      { referenceId: "ref-1", providerId: "prov-1", rules: RULES },
      now,
    );
    expect(result).toEqual({ success: true });
  });
});

// ---------------------------------------------------------------------------
// cancelReferenceInvitation
// ---------------------------------------------------------------------------

describe("cancelReferenceInvitation", () => {
  function makeCancelClient(
    row: unknown,
    captured: Captured,
  ) {
    // fetch chain (select) resolves to row; update chain captures payload
    const fetchChain = makeChain({ data: row, error: null });
    const updateChain = makeChain({ data: null, error: null }, captured);
    let call = 0;
    return {
      from: vi.fn(() => {
        call += 1;
        return call === 1 ? fetchChain : updateChain;
      }),
    } as unknown as Parameters<typeof cancelReferenceInvitation>[0];
  }

  it("cancels a pending/sent invite -> revoked with revoked_at", async () => {
    const captured: Captured = {};
    const now = new Date("2026-07-12T12:00:00Z");
    const client = makeCancelClient(
      { id: "ref-1", provider_id: "prov-1", status: "sent" },
      captured,
    );
    const result = await cancelReferenceInvitation(
      client,
      { referenceId: "ref-1", providerId: "prov-1" },
      now,
    );
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.status).toBe("revoked");
    expect(payload.revoked_at).toBe(now.toISOString());
  });

  it("returns not_cancellable from submitted", async () => {
    const captured: Captured = {};
    const client = makeCancelClient(
      { id: "ref-1", provider_id: "prov-1", status: "submitted" },
      captured,
    );
    const result = await cancelReferenceInvitation(client, {
      referenceId: "ref-1",
      providerId: "prov-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "not_cancellable" }),
    );
  });

  it("returns not_found for another provider's row", async () => {
    const captured: Captured = {};
    const client = makeCancelClient(
      { id: "ref-1", provider_id: "other", status: "sent" },
      captured,
    );
    const result = await cancelReferenceInvitation(client, {
      referenceId: "ref-1",
      providerId: "prov-1",
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, code: "not_found" }),
    );
  });
});

// ---------------------------------------------------------------------------
// markSentReference
// ---------------------------------------------------------------------------

describe("markSentReference", () => {
  function makeSendClient(currentRow: unknown, captured: Captured) {
    const fetchChain = makeChain({ data: currentRow, error: null });
    const updateChain = makeChain({ data: null, error: null }, captured);
    let call = 0;
    return {
      from: vi.fn(() => {
        call += 1;
        return call === 1 ? fetchChain : updateChain;
      }),
    } as unknown as Parameters<typeof markSentReference>[0];
  }

  it("writes hash, expiry, status sent, increments count, sets sent timestamps", async () => {
    const captured: Captured = {};
    const now = new Date("2026-07-12T12:00:00Z");
    const client = makeSendClient(
      { invite_sent_at: null, invite_send_count: 0 },
      captured,
    );
    const result = await markSentReference(
      client,
      "ref-1",
      { tokenHash: "a".repeat(64), expiresAt: "2026-08-11T12:00:00Z" },
      now,
    );
    expect(result).toEqual({ success: true });
    const payload = captured.update as Record<string, unknown>;
    expect(payload.invite_token_hash).toBe("a".repeat(64));
    expect(payload.invite_expires_at).toBe("2026-08-11T12:00:00Z");
    expect(payload.status).toBe("sent");
    expect(payload.invite_send_count).toBe(1);
    expect(payload.invite_sent_at).toBe(now.toISOString()); // COALESCE(null, now)
    expect(payload.invite_last_sent_at).toBe(now.toISOString());
  });

  it("preserves the original invite_sent_at on a resend", async () => {
    const captured: Captured = {};
    const now = new Date("2026-07-12T12:00:00Z");
    const original = "2026-07-01T09:00:00Z";
    const client = makeSendClient(
      { invite_sent_at: original, invite_send_count: 2 },
      captured,
    );
    await markSentReference(
      client,
      "ref-1",
      { tokenHash: "b".repeat(64), expiresAt: "2026-08-11T12:00:00Z" },
      now,
    );
    const payload = captured.update as Record<string, unknown>;
    expect(payload.invite_sent_at).toBe(original);
    expect(payload.invite_send_count).toBe(3);
  });

  it("surfaces the error message when the fetch fails", async () => {
    const captured: Captured = {};
    const fetchChain = makeChain({ data: null, error: { message: "boom" } });
    const updateChain = makeChain({ data: null, error: null }, captured);
    let call = 0;
    const client = {
      from: vi.fn(() => {
        call += 1;
        return call === 1 ? fetchChain : updateChain;
      }),
    } as unknown as Parameters<typeof markSentReference>[0];
    const result = await markSentReference(client, "ref-1", {
      tokenHash: "c".repeat(64),
      expiresAt: "2026-08-11T12:00:00Z",
    });
    expect(result).toEqual({ success: false, error: "boom" });
  });

  it("surfaces the error message when the update fails", async () => {
    const captured: Captured = {};
    const fetchChain = makeChain({
      data: { invite_sent_at: null, invite_send_count: 0 },
      error: null,
    });
    const updateChain = makeChain(
      { data: null, error: { message: "update boom" } },
      captured,
    );
    let call = 0;
    const client = {
      from: vi.fn(() => {
        call += 1;
        return call === 1 ? fetchChain : updateChain;
      }),
    } as unknown as Parameters<typeof markSentReference>[0];
    const result = await markSentReference(client, "ref-1", {
      tokenHash: "d".repeat(64),
      expiresAt: "2026-08-11T12:00:00Z",
    });
    expect(result).toEqual({ success: false, error: "update boom" });
  });
});
