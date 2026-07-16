/**
 * Tests for provider-verification-service.
 *
 * Functions under contract:
 *  - getVerificationSteps(providerId: string, client: SupabaseClient)
 *  - updateBadgeStatus(providerId: string, badgeType: string, status: string, client: SupabaseClient)
 *
 * NOTE: `sendReferenceRequest` was removed — its client-side insert is now
 * blocked by RLS. Requesting a reference goes through POST /api/provider/
 * references (see src/app/api/provider/references/route.test.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getVerificationSteps,
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

  // -- corrected verified-only reference counting ---------------------------

  /**
   * Builds a client where provider_documents resolves to [] and
   * provider_references resolves to the supplied rows.
   */
  function makeRefsClient(refs: Array<{ reference_type: string; status: string; requested_at: string | null }>) {
    const refChain = makeQueryMock({ data: refs, error: null }) as unknown as Record<string, unknown>;
    const docChain = makeQueryMock({ data: [], error: null }) as unknown as Record<string, unknown>;
    return {
      from: vi.fn((table: string) =>
        table === "provider_references" ? refChain : docChain,
      ),
    } as unknown as typeof emptyClient;
  }

  it("marks a reference step 'approved' only when a ref is verified", async () => {
    const client = makeRefsClient([
      { reference_type: "client", status: "verified", requested_at: "2026-07-01T00:00:00Z" },
    ]);
    const result = await getVerificationSteps("provider-uuid-1", client);
    const step = result.find((s) => s.stepId === "client_references");
    expect(step?.status).toBe("approved");
  });

  it("marks a reference step 'in_progress' for submitted/sent/pending refs", async () => {
    const client = makeRefsClient([
      { reference_type: "peer", status: "submitted", requested_at: "2026-07-01T00:00:00Z" },
    ]);
    const result = await getVerificationSteps("provider-uuid-1", client);
    const step = result.find((s) => s.stepId === "peer_references");
    // Corrected behavior: 'submitted' is in-flight, NOT done — only 'verified'
    // counts as approved.
    expect(step?.status).toBe("in_progress");
  });

  it("does NOT count terminal-fail refs (rejected/declined/expired/revoked/flagged) as done", async () => {
    const client = makeRefsClient([
      { reference_type: "client", status: "rejected", requested_at: "2026-07-01T00:00:00Z" },
      { reference_type: "client", status: "flagged", requested_at: "2026-07-02T00:00:00Z" },
    ]);
    const result = await getVerificationSteps("provider-uuid-1", client);
    const step = result.find((s) => s.stepId === "client_references");
    // No verified and no in-flight refs -> nothing usable -> not_started.
    expect(step?.status).toBe("not_started");
  });
});

// ---------------------------------------------------------------------------
// getVerificationSteps — id_check from profiles.kyc_status
// ---------------------------------------------------------------------------

describe("getVerificationSteps — id_check from profiles.kyc_status", () => {
  function fakeSupabaseWithKyc(kycStatus: string | null) {
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => {
            if (table === "profiles") {
              return {
                maybeSingle: async () => ({
                  data: kycStatus === null ? null : { kyc_status: kycStatus },
                  error: null,
                }),
              };
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    } as unknown as SupabaseClient;
  }

  it.each([
    ["not_started", "not_started"],
    ["pending", "submitted"],
    ["verified", "approved"],
    ["failed", "rejected"],
  ] as const)("kyc_status %s → step status %s", async (kycStatus, expected) => {
    const steps = await getVerificationSteps("user-1", fakeSupabaseWithKyc(kycStatus));
    const idCheck = steps.find((s) => s.stepId === "id_check");
    expect(idCheck?.status).toBe(expected);
  });

  it("treats a missing profile row as not_started", async () => {
    const steps = await getVerificationSteps("user-1", fakeSupabaseWithKyc(null));
    expect(steps.find((s) => s.stepId === "id_check")?.status).toBe("not_started");
  });

  it("sets a rejection reason when kyc failed", async () => {
    const steps = await getVerificationSteps("user-1", fakeSupabaseWithKyc("failed"));
    const idCheck = steps.find((s) => s.stepId === "id_check");
    expect(idCheck?.rejectionReason).toMatch(/not successful/i);
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
