/**
 * Contract stubs for provider-job-service.
 *
 * These tests document the expected API surface and return shapes that
 * Wave 2 must implement. They are intentionally NOT passing — the service
 * file does not exist yet. Do not make these pass until Wave 2.
 *
 * Functions under contract:
 *  - getProviderLeads(providerId: string, client: SupabaseClient)
 *  - acceptLead(leadId: string, providerId: string, client: SupabaseClient)
 *  - declineLead(leadId: string, providerId: string, reason: string, client: SupabaseClient)
 *  - getJobDetail(jobId: string, providerId: string, client: SupabaseClient)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// @ts-expect-error — service not yet implemented (Wave 2)
import {
  acceptLead,
  declineLead,
  getJobDetail,
  getProviderLeads,
} from "../provider-job-service";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockClient = {} as ReturnType<typeof import("@supabase/supabase-js").createClient>;

// ---------------------------------------------------------------------------
// getProviderLeads
// ---------------------------------------------------------------------------

describe("getProviderLeads", () => {
  it("returns an array of lead objects with the correct shape", async () => {
    const result = await getProviderLeads("provider-uuid-1", mockClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          /** Lead record id */
          id: expect.any(String),
          /** Client display name (may be anonymised until accepted) */
          clientName: expect.any(String),
          /** Service category, e.g. "Plumbing", "Electrical" */
          serviceCategory: expect.any(String),
          /** Short description of work required */
          description: expect.any(String),
          /** Town / city of the job */
          location: expect.any(String),
          /**
           * Lead status:
           * 'new' | 'accepted' | 'declined' | 'expired' | 'converted'
           */
          status: expect.any(String),
          /** Estimated budget range in pence (null if not provided by client) */
          budgetMinPence: expect.anything(),
          budgetMaxPence: expect.anything(),
          /** ISO 8601 timestamp when the lead was created */
          createdAt: expect.any(String),
          /** ISO 8601 expiry timestamp (leads expire if not actioned within 48h) */
          expiresAt: expect.any(String),
        }),
      );
    }
  });

  it("only returns leads belonging to the given provider", async () => {
    const result = await getProviderLeads("provider-uuid-1", mockClient);
    // All returned leads should be addressable to this provider — no cross-provider leakage
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an empty array (not null) when the provider has no leads", async () => {
    const result = await getProviderLeads("provider-uuid-new", mockClient);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("does not return expired leads in the default response", async () => {
    const result = await getProviderLeads("provider-uuid-1", mockClient);
    const hasExpired = result.some((l: { status: string }) => l.status === "expired");
    expect(hasExpired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// acceptLead
// ---------------------------------------------------------------------------

describe("acceptLead", () => {
  it("returns a job record with status 'active' after acceptance", async () => {
    const result = await acceptLead("lead-uuid-1", "provider-uuid-1", mockClient);

    expect(result).toEqual(
      expect.objectContaining({
        /** Newly created job id */
        jobId: expect.any(String),
        /** Source lead id */
        leadId: expect.any(String),
        /** Job status after acceptance */
        status: "active",
        /** ISO 8601 timestamp */
        acceptedAt: expect.any(String),
      }),
    );
  });

  it("throws when the lead does not belong to the provider", async () => {
    await expect(
      acceptLead("lead-uuid-other", "provider-uuid-1", mockClient),
    ).rejects.toThrow();
  });

  it("throws when the lead has already been accepted or expired", async () => {
    await expect(
      acceptLead("lead-uuid-expired", "provider-uuid-1", mockClient),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// declineLead
// ---------------------------------------------------------------------------

describe("declineLead", () => {
  it("returns a confirmation with status 'declined'", async () => {
    const result = await declineLead(
      "lead-uuid-2",
      "provider-uuid-1",
      "Too far from my base location",
      mockClient,
    );

    expect(result).toEqual(
      expect.objectContaining({
        leadId: expect.any(String),
        status: "declined",
        /** ISO 8601 timestamp */
        declinedAt: expect.any(String),
      }),
    );
  });

  it("records the decline reason on the lead record", async () => {
    const result = await declineLead(
      "lead-uuid-3",
      "provider-uuid-1",
      "Outside service area",
      mockClient,
    );

    expect(result).toEqual(
      expect.objectContaining({
        declineReason: "Outside service area",
      }),
    );
  });

  it("throws when the lead does not belong to the provider", async () => {
    await expect(
      declineLead("lead-uuid-other", "provider-uuid-1", "reason", mockClient),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getJobDetail
// ---------------------------------------------------------------------------

describe("getJobDetail", () => {
  it("returns a full job detail object with the correct shape", async () => {
    const result = await getJobDetail("job-uuid-1", "provider-uuid-1", mockClient);

    expect(result).toEqual(
      expect.objectContaining({
        /** Job id */
        id: expect.any(String),
        /** Status: 'active' | 'completed' | 'cancelled' | 'disputed' */
        status: expect.any(String),
        /** Service type label */
        serviceType: expect.any(String),
        /** Full description of work */
        description: expect.any(String),
        /** Client information */
        client: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          phone: expect.anything(),
        }),
        /** Property / site address */
        address: expect.objectContaining({
          line1: expect.any(String),
          city: expect.any(String),
          postcode: expect.any(String),
        }),
        /** Agreed price in pence (null until quote accepted) */
        agreedPricePence: expect.anything(),
        /** Scheduled start date-time (ISO 8601) */
        scheduledAt: expect.anything(),
        /** Completion date-time (ISO 8601, null if not yet completed) */
        completedAt: expect.anything(),
        /** Array of uploaded photos/documents */
        attachments: expect.any(Array),
        /** Timeline of status changes */
        timeline: expect.any(Array),
        /** ISO 8601 creation timestamp */
        createdAt: expect.any(String),
      }),
    );
  });

  it("returns null when the job does not exist", async () => {
    const result = await getJobDetail("nonexistent-job", "provider-uuid-1", mockClient);
    expect(result).toBeNull();
  });

  it("throws an authorization error when the job belongs to a different provider", async () => {
    await expect(
      getJobDetail("job-uuid-other-provider", "provider-uuid-1", mockClient),
    ).rejects.toThrow();
  });

  it("includes at least one timeline entry for an active job", async () => {
    const result = await getJobDetail("job-uuid-1", "provider-uuid-1", mockClient);
    if (result !== null) {
      expect(result.timeline.length).toBeGreaterThan(0);
    }
  });
});
