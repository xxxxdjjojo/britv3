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

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getVerificationSteps,
  uploadVerificationDocument,
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
  it("derives document progress from the canonical provider document schema", async () => {
    let selectedColumns = "";
    let ownerColumn = "";
    const documents = [
      {
        document_type: "identity_proof",
        verification_status: "approved",
        updated_at: "2026-07-15T09:00:00Z",
        reviewer_notes: null,
      },
      {
        document_type: "insurance_certificate",
        verification_status: "rejected",
        updated_at: "2026-07-15T10:00:00Z",
        reviewer_notes: "Policy has expired",
      },
    ];
    const documentQuery: Record<string, unknown> = {};
    documentQuery.select = vi.fn((columns: string) => {
      selectedColumns = columns;
      return documentQuery;
    });
    documentQuery.eq = vi.fn((column: string) => {
      ownerColumn = column;
      return documentQuery;
    });
    documentQuery.then = (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) =>
      Promise.resolve(
        selectedColumns ===
          "document_type, verification_status, updated_at, reviewer_notes" &&
          ownerColumn === "user_id"
          ? { data: documents, error: null }
          : { data: null, error: { message: "provider_documents column does not exist" } },
      ).then(resolve, reject);

    const references = makeQueryMock({ data: [], error: null });
    const client = {
      from: vi.fn((table: string) =>
        table === "provider_documents" ? documentQuery : references,
      ),
    } as unknown as typeof emptyClient;

    const result = await getVerificationSteps("provider-uuid-1", client);

    expect(result.find((step) => step.stepId === "id_check")?.status).toBe(
      "approved",
    );
    expect(result.find((step) => step.stepId === "insurance")).toEqual(
      expect.objectContaining({
        status: "rejected",
        rejectionReason: "Policy has expired",
      }),
    );
  });

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

  // -- canonical vouch gate counting -----------------------------------------

  /**
   * Builds a client where provider_documents resolves to [] and
   * vouch_requests resolves to the supplied canonical lifecycle rows.
   */
  function makeRefsClient(refs: Array<{ voucher_kind: string; status: string; requested_at: string | null }>) {
    const refChain = makeQueryMock({ data: refs, error: null }) as unknown as Record<string, unknown>;
    const docChain = makeQueryMock({ data: [], error: null }) as unknown as Record<string, unknown>;
    return {
      from: vi.fn((table: string) =>
        table === "vouch_requests" ? refChain : docChain,
      ),
    } as unknown as typeof emptyClient;
  }

  it("marks a vouch step approved only after all three canonical vouches are accepted", async () => {
    const client = makeRefsClient([
      { voucher_kind: "client", status: "accepted", requested_at: "2026-07-01T00:00:00Z" },
      { voucher_kind: "client", status: "accepted", requested_at: "2026-07-02T00:00:00Z" },
      { voucher_kind: "client", status: "accepted", requested_at: "2026-07-03T00:00:00Z" },
    ]);
    const result = await getVerificationSteps("provider-uuid-1", client);
    const step = result.find((s) => s.stepId === "client_references");
    expect(step?.status).toBe("approved");
  });

  it("marks a vouch step in progress for partial acceptance or a pending invite", async () => {
    const client = makeRefsClient([
      { voucher_kind: "peer", status: "accepted", requested_at: "2026-07-01T00:00:00Z" },
      { voucher_kind: "peer", status: "pending", requested_at: "2026-07-02T00:00:00Z" },
    ]);
    const result = await getVerificationSteps("provider-uuid-1", client);
    const step = result.find((s) => s.stepId === "peer_references");
    expect(step?.status).toBe("in_progress");
  });

  it("does NOT count terminal-fail refs (rejected/declined/expired/revoked/flagged) as done", async () => {
    const client = makeRefsClient([
      { voucher_kind: "client", status: "declined", requested_at: "2026-07-01T00:00:00Z" },
      { voucher_kind: "client", status: "revoked", requested_at: "2026-07-02T00:00:00Z" },
    ]);
    const result = await getVerificationSteps("provider-uuid-1", client);
    const step = result.find((s) => s.stepId === "client_references");
    // No verified and no in-flight refs -> nothing usable -> not_started.
    expect(step?.status).toBe("not_started");
  });
});

describe("uploadVerificationDocument", () => {
  it("persists the uploaded file metadata using the canonical document columns", async () => {
    const insert = vi.fn((payload: Record<string, unknown>) => {
      const requiredKeys = [
        "user_id",
        "document_type",
        "file_name",
        "file_url",
        "file_size",
        "mime_type",
        "verification_status",
      ];
      const valid = requiredKeys.every((key) => key in payload);
      const terminal = {
        single: vi.fn().mockResolvedValue(
          valid
            ? { data: { id: "document-1" }, error: null }
            : { data: null, error: { message: "missing document metadata" } },
        ),
      };
      return { select: vi.fn(() => terminal) };
    });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = {
      storage: {
        from: vi.fn((bucket: string) => ({
          upload: bucket === "provider-docs"
            ? upload
            : vi.fn().mockResolvedValue({ error: { message: "unknown bucket" } }),
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: "https://files.example/identity.pdf" },
          })),
        })),
      },
      from: vi.fn(() => ({ insert })),
    } as unknown as typeof emptyClient;
    const file = new File(["identity"], "identity.pdf", {
      type: "application/pdf",
    });

    await expect(
      uploadVerificationDocument(client, "provider-uuid-1", "identity_proof", file),
    ).resolves.toEqual(
      expect.objectContaining({ document_id: "document-1" }),
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
