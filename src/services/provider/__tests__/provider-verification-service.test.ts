/**
 * Contract stubs for provider-verification-service.
 *
 * These tests document the expected API surface and return shapes that
 * Wave 2 must implement. They are intentionally NOT passing — the service
 * file does not exist yet. Do not make these pass until Wave 2.
 *
 * Functions under contract:
 *  - getVerificationSteps(providerId: string, client: SupabaseClient)
 *  - sendReferenceRequest(providerId: string, refereeEmail: string, refereeName: string, client: SupabaseClient)
 *  - updateBadgeStatus(providerId: string, badgeType: string, status: string, client: SupabaseClient)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// @ts-expect-error — service not yet implemented (Wave 2)
import {
  getVerificationSteps,
  sendReferenceRequest,
  updateBadgeStatus,
} from "../provider-verification-service";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockClient = {} as ReturnType<typeof import("@supabase/supabase-js").createClient>;

// ---------------------------------------------------------------------------
// getVerificationSteps
// ---------------------------------------------------------------------------

describe("getVerificationSteps", () => {
  it("returns an array of verification steps with the correct shape", async () => {
    const result = await getVerificationSteps("provider-uuid-1", mockClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          /** Step identifier, e.g. 'id_check' | 'insurance' | 'qualifications' | 'reference_1' */
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
          /** Optional ISO 8601 timestamp when this step was last updated */
          updatedAt: expect.anything(),
        }),
      );
    }
  });

  it("always includes the mandatory ID check step", async () => {
    const result = await getVerificationSteps("provider-uuid-1", mockClient);
    const idCheckStep = result.find((s: { stepId: string }) => s.stepId === "id_check");
    expect(idCheckStep).toBeDefined();
  });

  it("returns steps for a brand-new provider all with status not_started", async () => {
    const result = await getVerificationSteps("provider-uuid-new", mockClient);
    const allNotStarted = result.every(
      (s: { status: string }) => s.status === "not_started",
    );
    expect(allNotStarted).toBe(true);
  });

  it("returns a non-empty array (there are always steps to complete)", async () => {
    const result = await getVerificationSteps("provider-uuid-1", mockClient);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// sendReferenceRequest
// ---------------------------------------------------------------------------

describe("sendReferenceRequest", () => {
  it("returns a success result with the reference request id", async () => {
    const result = await sendReferenceRequest(
      "provider-uuid-1",
      "client@example.com",
      "Jane Smith",
      mockClient,
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
      mockClient,
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.any(String),
      }),
    );
  });

  it("returns success: false when a duplicate request already exists for the same email", async () => {
    // First request
    await sendReferenceRequest(
      "provider-uuid-1",
      "duplicate@example.com",
      "Jane Smith",
      mockClient,
    );

    // Second identical request
    const result = await sendReferenceRequest(
      "provider-uuid-1",
      "duplicate@example.com",
      "Jane Smith",
      mockClient,
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
  it("returns an updated badge record with the new status", async () => {
    const result = await updateBadgeStatus(
      "provider-uuid-1",
      "verified_trader",
      "approved",
      mockClient,
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
    const result = await updateBadgeStatus(
      "provider-uuid-1",
      "gas_safe",
      "revoked",
      mockClient,
    );
    expect(result.status).toBe("revoked");
  });

  it("throws or returns an error shape when an invalid badgeType is supplied", async () => {
    await expect(
      updateBadgeStatus("provider-uuid-1", "nonexistent_badge", "approved", mockClient),
    ).rejects.toThrow();
  });
});
