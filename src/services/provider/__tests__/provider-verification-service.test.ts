/**
 * Tests for provider-verification-service.
 *
 * Functions under contract:
 *  - getVerificationSteps(providerId: string, client: SupabaseClient)
 *  - sendReferenceRequest(providerId: string, refereeEmail: string, refereeName: string, client: SupabaseClient)
 *  - updateBadgeStatus(providerId: string, badgeType: string, status: string, client: SupabaseClient)
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getVerificationSteps,
  sendReferenceRequest,
  updateBadgeStatus,
} from "../provider-verification-service";

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query mock
// ---------------------------------------------------------------------------

/**
 * Returns a fluent mock that resolves to `resolveValue` at the end of any
 * query chain (.from().select().eq()…).
 */
function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Terminal calls resolve to the provided value
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  // Make the chain itself thenable so `await supabase.from(...).select(...)` works
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

/**
 * Empty mock — all DB calls return { data: null, error: null }.
 * Used where we expect graceful fallback to default values.
 */
const emptyClient = makeQueryMock({ data: null, error: null });

// ---------------------------------------------------------------------------
// getVerificationSteps
// ---------------------------------------------------------------------------

describe("getVerificationSteps", () => {
  it("returns an array of verification steps with the correct shape", async () => {
    const result = await getVerificationSteps("provider-uuid-1", emptyClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          /** Step identifier, e.g. 'id_check' | 'insurance' | 'qualifications' | 'client_references' | 'peer_references' */
          stepId: expect.any(String),
          /** Human-readable label */
          label: expect.any(String),
          /**
           * Step status:
           * 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
           */
          status: expect.any(String),
          /** Whether this step is required for the Verified badge */
          required: expect.any(Boolean),
          /** Optional ISO 8601 timestamp when this step was last updated (string or null) */
          updatedAt: expect.toSatisfy((v: unknown) => v === null || typeof v === "string"),
        }),
      );
    }
  });

  it("always includes the mandatory ID check step", async () => {
    const result = await getVerificationSteps("provider-uuid-1", emptyClient);
    const idCheckStep = result.find((s) => s.stepId === "id_check");
    expect(idCheckStep).toBeDefined();
  });

  it("returns steps for a brand-new provider all with status not_started", async () => {
    const result = await getVerificationSteps("provider-uuid-new", emptyClient);
    const allNotStarted = result.every((s) => s.status === "not_started");
    expect(allNotStarted).toBe(true);
  });

  it("returns a non-empty array (there are always steps to complete)", async () => {
    const result = await getVerificationSteps("provider-uuid-1", emptyClient);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// sendReferenceRequest
// ---------------------------------------------------------------------------

describe("sendReferenceRequest", () => {
  // In-memory set to track which emails have been "inserted" during this test suite
  const insertedEmails = new Set<string>();

  beforeEach(() => {
    insertedEmails.clear();
  });

  /**
   * Builds a Supabase mock that:
   * - maybeSingle() for the duplicate-check returns { data: null } (not a duplicate)
   *   or { data: { id: "existing" } } (duplicate) depending on the email.
   * - single() for the insert returns the created row.
   */
  function makeReferenceClient(email: string) {
    const isDuplicate = insertedEmails.has(`provider-uuid-1:${email}`);

    const insertChain: Record<string, unknown> = {};
    const insertMethods = ["select", "single"];
    for (const m of insertMethods) {
      insertChain[m] = vi.fn(() => insertChain);
    }
    (insertChain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "ref-uuid-" + Date.now() },
      error: null,
    });

    const checkChain: Record<string, unknown> = {};
    const checkMethods = ["select", "eq", "maybeSingle"];
    for (const m of checkMethods) {
      checkChain[m] = vi.fn(() => checkChain);
    }
    (checkChain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: isDuplicate ? { id: "existing-ref" } : null,
      error: null,
    });

    // Track the insert call
    const fromMock = vi.fn((table: string) => {
      if (table === "provider_references") {
        return {
          select: vi.fn(() => checkChain),
          insert: vi.fn(() => {
            if (!isDuplicate) insertedEmails.add(`provider-uuid-1:${email}`);
            return insertChain;
          }),
        };
      }
      return checkChain;
    });

    return { from: fromMock } as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >;
  }

  it("returns a success result with the reference request id", async () => {
    const client = makeReferenceClient("client@example.com");
    const result = await sendReferenceRequest(
      "provider-uuid-1",
      "client@example.com",
      "Jane Smith",
      client,
    );

    expect(result).toEqual(
      expect.objectContaining({
        /** Whether the email was queued successfully */
        success: true,
        /** The created reference_request record id */
        referenceRequestId: expect.any(String),
      }),
    );
  });

  it("returns success: false with an error message when the email is invalid", async () => {
    const result = await sendReferenceRequest(
      "provider-uuid-1",
      "not-an-email",
      "Jane Smith",
      emptyClient,
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.any(String),
      }),
    );
  });

  it("returns success: false when a duplicate request already exists for the same email", async () => {
    // First request — marks email as inserted
    const client1 = makeReferenceClient("duplicate@example.com");
    await sendReferenceRequest(
      "provider-uuid-1",
      "duplicate@example.com",
      "Jane Smith",
      client1,
    );

    // Second identical request — sees the email in insertedEmails
    const client2 = makeReferenceClient("duplicate@example.com");
    const result = await sendReferenceRequest(
      "provider-uuid-1",
      "duplicate@example.com",
      "Jane Smith",
      client2,
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining("duplicate"),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// updateBadgeStatus
// ---------------------------------------------------------------------------

describe("updateBadgeStatus", () => {
  const VALID_BADGE_TYPES = ["verified_trader", "gas_safe"];

  function makeBadgeClient(badgeType: string, status: string) {
    const isValid = VALID_BADGE_TYPES.includes(badgeType);

    const updateChain: Record<string, unknown> = {};
    const methods = ["eq", "select", "single"];
    for (const m of methods) {
      updateChain[m] = vi.fn(() => updateChain);
    }
    (updateChain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(
      isValid
        ? { data: { badge_type: badgeType, is_active: status === "approved" }, error: null }
        : { data: null, error: { message: `Badge type '${badgeType}' not found` } },
    );

    return {
      from: vi.fn(() => ({
        update: vi.fn(() => updateChain),
      })),
    } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  }

  it("returns an updated badge record with the new status", async () => {
    const client = makeBadgeClient("verified_trader", "approved");
    const result = await updateBadgeStatus(
      "provider-uuid-1",
      "verified_trader",
      "approved",
      client,
    );

    expect(result).toEqual(
      expect.objectContaining({
        /** Provider id */
        providerId: expect.any(String),
        /** Badge type identifier */
        badgeType: expect.any(String),
        /** New status: 'pending' | 'approved' | 'revoked' */
        status: expect.any(String),
        /** ISO 8601 timestamp of update */
        updatedAt: expect.any(String),
      }),
    );
  });

  it("returns status matching the value passed in", async () => {
    const client = makeBadgeClient("gas_safe", "revoked");
    const result = await updateBadgeStatus("provider-uuid-1", "gas_safe", "revoked", client);
    expect(result.status).toBe("revoked");
  });

  it("throws or returns an error shape when an invalid badgeType is supplied", async () => {
    const client = makeBadgeClient("nonexistent_badge", "approved");
    await expect(
      updateBadgeStatus("provider-uuid-1", "nonexistent_badge", "approved", client),
    ).rejects.toThrow();
  });
});
