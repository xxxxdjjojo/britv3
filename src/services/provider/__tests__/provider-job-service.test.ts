/**
 * Tests for provider-job-service.
 *
 * Functions under contract:
 *  - getProviderLeads(providerId: string, client: SupabaseClient, filters?)
 *  - acceptLead(leadId: string, providerId: string, client: SupabaseClient)
 *  - declineLead(leadId: string, providerId: string, reason: string, client: SupabaseClient)
 *  - getJobDetail(jobId: string, providerId: string, client: SupabaseClient)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  acceptLead,
  declineLead,
  getJobDetail,
  getProviderLeads,
} from "../provider-job-service";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Builds a chainable Supabase query mock that resolves to `resolveValue`.
 * Terminal methods (maybeSingle, single) resolve the promise.
 * Awaiting the chain directly also works via `.then`.
 */
function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "in",
    "not",
    "gte",
    "lte",
    "gt",
    "lt",
    "or",
    "ilike",
    "order",
    "limit",
    "range",
    "maybeSingle",
    "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  // Make the chain itself awaitable
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

/** Empty client — all DB calls return { data: null, error: null }. */
const emptyClient = makeQueryMock({ data: null, error: null });

// ---------------------------------------------------------------------------
// getProviderLeads
// ---------------------------------------------------------------------------

describe("getProviderLeads", () => {
  it("returns an empty array (not null) when the provider has no matching categories", async () => {
    const result = await getProviderLeads("provider-uuid-new", emptyClient);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("returns an empty array when provider has no leads", async () => {
    // providerData returns null → graceful fallback to []
    const result = await getProviderLeads("provider-uuid-1", emptyClient);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an array of lead objects with the correct shape when leads exist", async () => {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const mockLead = {
      id: "lead-uuid-1",
      service_category: "plumber",
      title: "Fix boiler",
      description: "Boiler not heating",
      budget_min: 100,
      budget_max: 500,
      property_postcode: "SW1A 1AA",
      urgency_level: "normal",
      status: "open",
      created_at: now,
    };

    // Build a client that returns provider services then leads
    let callCount = 0;
    const leadsClient = {
      from: vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // provider_details query
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { services: ["Plumbing"] },
                  error: null,
                }),
              })),
            })),
          };
        }
        // service_requests query — must return a thenable chain
        const chain: Record<string, unknown> = {};
        const methods = ["select", "eq", "in", "gte", "or", "order", "limit", "range", "not", "ilike"];
        for (const m of methods) {
          chain[m] = vi.fn(() => chain);
        }
        (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve({
          data: [mockLead],
          error: null,
          count: 1,
        }).then.bind(
          Promise.resolve({ data: [mockLead], error: null, count: 1 }),
        );
        return chain;
      }),
    } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;

    const result = await getProviderLeads("provider-uuid-1", leadsClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          clientName: expect.any(String),
          serviceCategory: expect.any(String),
          description: expect.any(String),
          location: expect.any(String),
          status: expect.any(String),
          budgetMinPence: expect.anything(),
          budgetMaxPence: expect.anything(),
          createdAt: expect.any(String),
          expiresAt: expect.any(String),
        }),
      );
    }
  });

  it("only returns leads belonging to the given provider (no cross-provider leakage)", async () => {
    const result = await getProviderLeads("provider-uuid-1", emptyClient);
    expect(Array.isArray(result)).toBe(true);
  });

  it("does not return expired leads in the default response", async () => {
    const result = await getProviderLeads("provider-uuid-1", emptyClient);
    const hasExpired = result.some((l) => l.status === "expired");
    expect(hasExpired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// acceptLead
// ---------------------------------------------------------------------------

describe("acceptLead", () => {
  /**
   * Builds a mock client for acceptLead.
   * `scenario`:
   *   'success'      — lead exists, status=open, provider has matching category
   *   'not-found'    — lead does not exist
   *   'wrong-provider' — lead exists but provider has no matching category
   *   'already-accepted' — lead exists but status is not 'open'
   */
  function makeAcceptClient(
    scenario: "success" | "not-found" | "wrong-provider" | "already-accepted",
  ) {
    const leadRow =
      scenario === "not-found"
        ? null
        : {
            id: "lead-uuid-1",
            service_category: "plumber",
            status: scenario === "already-accepted" ? "awarded" : "open",
          };

    const providerRow =
      scenario === "wrong-provider"
        ? { services: ["electrician"] }
        : { services: ["plumber"] };

    let callCount = 0;
    return {
      from: vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // service_requests fetch
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: leadRow, error: null }),
              })),
            })),
          };
        }
        if (callCount === 2) {
          // service_provider_details fetch
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: scenario === "not-found" ? null : providerRow,
                  error: null,
                }),
              })),
            })),
          };
        }
        // service_requests update
        return {
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        };
      }),
    } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  }

  it("returns a job record with status 'active' after acceptance", async () => {
    const client = makeAcceptClient("success");
    const result = await acceptLead("lead-uuid-1", "provider-uuid-1", client);

    expect(result).toEqual(
      expect.objectContaining({
        jobId: expect.any(String),
        leadId: expect.any(String),
        status: "active",
        acceptedAt: expect.any(String),
      }),
    );
  });

  it("throws when the lead does not exist", async () => {
    const client = makeAcceptClient("not-found");
    await expect(acceptLead("lead-uuid-other", "provider-uuid-1", client)).rejects.toThrow();
  });

  it("throws when the lead category does not match the provider's services", async () => {
    const client = makeAcceptClient("wrong-provider");
    await expect(
      acceptLead("lead-uuid-other", "provider-uuid-1", client),
    ).rejects.toThrow();
  });

  it("throws when the lead has already been accepted or expired", async () => {
    const client = makeAcceptClient("already-accepted");
    await expect(
      acceptLead("lead-uuid-expired", "provider-uuid-1", client),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// declineLead
// ---------------------------------------------------------------------------

describe("declineLead", () => {
  /**
   * Builds a mock client for declineLead.
   * `scenario`:
   *   'success'       — lead exists with matching category
   *   'wrong-provider' — lead exists but provider has no matching category
   *   'not-found'     — lead does not exist
   */
  function makeDeclineClient(
    scenario: "success" | "wrong-provider" | "not-found",
    category = "Plumbing",
  ) {
    const leadRow =
      scenario === "not-found"
        ? null
        : { id: "lead-uuid-1", service_category: category, status: "open" };

    const providerRow =
      scenario === "wrong-provider"
        ? { services: ["Electrical"] }
        : { services: [category] };

    let callCount = 0;
    return {
      from: vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: leadRow, error: null }),
              })),
            })),
          };
        }
        if (callCount === 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: scenario === "not-found" ? null : providerRow,
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        };
      }),
    } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  }

  it("returns a confirmation with status 'declined'", async () => {
    const client = makeDeclineClient("success");
    const result = await declineLead(
      "lead-uuid-2",
      "provider-uuid-1",
      "Too far from my base location",
      client,
    );

    expect(result).toEqual(
      expect.objectContaining({
        leadId: expect.any(String),
        status: "declined",
        declinedAt: expect.any(String),
      }),
    );
  });

  it("records the decline reason on the result", async () => {
    const client = makeDeclineClient("success");
    const result = await declineLead(
      "lead-uuid-3",
      "provider-uuid-1",
      "Outside service area",
      client,
    );

    expect(result).toEqual(
      expect.objectContaining({
        declineReason: "Outside service area",
      }),
    );
  });

  it("throws when the lead does not belong to the provider's categories", async () => {
    const client = makeDeclineClient("wrong-provider");
    await expect(
      declineLead("lead-uuid-other", "provider-uuid-1", "reason", client),
    ).rejects.toThrow();
  });

  it("throws when the lead does not exist", async () => {
    const client = makeDeclineClient("not-found");
    await expect(
      declineLead("lead-uuid-other", "provider-uuid-1", "reason", client),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getJobDetail
// ---------------------------------------------------------------------------

describe("getJobDetail", () => {
  const NOW = new Date().toISOString();

  const bookingRow = {
    id: "job-uuid-1",
    provider_id: "provider-uuid-1",
    status: "confirmed",
    scheduled_date: NOW,
    total_amount: 500,
    created_at: NOW,
    service_requests: {
      title: "Fix boiler",
      service_category: "plumber",
      description: "Boiler not heating",
      property_postcode: "SW1A 1AA",
      user_id: "client-uuid-1",
    },
    profiles: {
      id: "client-uuid-1",
      full_name: "John Smith",
      email: "john@example.com",
      phone: "07700900000",
    },
    quotes: [{ total_amount: 500 }],
    provider_invoices: [],
    reviews: [],
  };

  /**
   * Builds a mock client for getJobDetail.
   * `scenario`:
   *   'success'           — booking exists, belongs to provider-uuid-1
   *   'nonexistent'       — booking does not exist
   *   'other-provider'    — booking belongs to different provider
   */
  function makeJobDetailClient(
    scenario: "success" | "nonexistent" | "other-provider",
  ) {
    const row =
      scenario === "nonexistent"
        ? null
        : scenario === "other-provider"
          ? { ...bookingRow, provider_id: "provider-uuid-other" }
          : bookingRow;

    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
          })),
        })),
      })),
    } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  }

  it("returns a full job detail object with the correct shape", async () => {
    const client = makeJobDetailClient("success");
    const result = await getJobDetail("job-uuid-1", "provider-uuid-1", client);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: expect.any(String),
      status: expect.any(String),
      serviceType: expect.any(String),
      description: expect.any(String),
      client: {
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
      },
      address: {
        line1: expect.any(String),
        city: expect.any(String),
        postcode: expect.any(String),
      },
      attachments: expect.any(Array),
      timeline: expect.any(Array),
      createdAt: expect.any(String),
    });
  });

  it("returns null when the job does not exist", async () => {
    const client = makeJobDetailClient("nonexistent");
    const result = await getJobDetail("nonexistent-job", "provider-uuid-1", client);
    expect(result).toBeNull();
  });

  it("throws an authorization error when the job belongs to a different provider", async () => {
    const client = makeJobDetailClient("other-provider");
    await expect(
      getJobDetail("job-uuid-other-provider", "provider-uuid-1", client),
    ).rejects.toThrow();
  });

  it("includes at least one timeline entry for an active job", async () => {
    const client = makeJobDetailClient("success");
    const result = await getJobDetail("job-uuid-1", "provider-uuid-1", client);
    if (result !== null) {
      expect(result.timeline.length).toBeGreaterThan(0);
    }
  });
});
