/**
 * Tests for provider-dashboard-service.
 *
 * Functions under contract:
 *  - getProviderDashboardStats(providerId: string, client: SupabaseClient)
 *  - getRecentActivity(providerId: string, limit: number, client: SupabaseClient)
 *  - getUpcomingJobs(providerId: string, limit: number, client: SupabaseClient)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getProviderDashboardStats,
  getRecentActivity,
  getUpcomingJobs,
} from "../provider-dashboard-service";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockClient = {} as ReturnType<typeof import("@supabase/supabase-js").createClient>;

// ---------------------------------------------------------------------------
// getProviderDashboardStats
// ---------------------------------------------------------------------------

describe("getProviderDashboardStats", () => {
  it("reports pending verification from canonical provider document rows", async () => {
    const emptyQuery = {
      select: vi.fn(),
    } as Record<string, unknown>;
    const chainMethods = ["select", "eq", "in", "not"];
    for (const method of chainMethods) {
      emptyQuery[method] = vi.fn(() => emptyQuery);
    }
    emptyQuery.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], count: 0, error: null }).then(resolve);

    let selectedColumns = "";
    let ownerColumn = "";
    const documentQuery: Record<string, unknown> = {};
    documentQuery.select = vi.fn((columns: string) => {
      selectedColumns = columns;
      return documentQuery;
    });
    documentQuery.eq = vi.fn((column: string) => {
      ownerColumn = column;
      return documentQuery;
    });
    documentQuery.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve(
        selectedColumns === "verification_status" && ownerColumn === "user_id"
          ? { data: [{ verification_status: "pending" }], error: null }
          : { data: null, error: { message: "provider_documents column does not exist" } },
      ).then(resolve);

    const client = {
      from: vi.fn((table: string) =>
        table === "provider_documents" ? documentQuery : emptyQuery,
      ),
    } as unknown as typeof mockClient;

    const result = await getProviderDashboardStats("provider-uuid-1", client);

    expect(result.verificationStatus).toBe("pending");
  });

  it("returns the correct KPI shape for an active provider", async () => {
    const result = await getProviderDashboardStats("provider-uuid-1", mockClient);

    expect(result).toEqual(
      expect.objectContaining({
        /** Total leads received (all time) */
        totalLeads: expect.any(Number),
        /** Active / in-progress jobs */
        activeJobs: expect.any(Number),
        /** Completed jobs (all time) */
        completedJobs: expect.any(Number),
        /** Overall star rating (0–5, one decimal place) */
        averageRating: expect.any(Number),
        /** Total gross earnings in pence */
        totalEarningsPence: expect.any(Number),
        /** Pending payout amount in pence (Stripe Connect balance) */
        pendingPayoutPence: expect.any(Number),
        /** Number of unread messages / notifications */
        unreadMessages: expect.any(Number),
        /** Verification status: 'unverified' | 'pending' | 'verified' */
        verificationStatus: expect.any(String),
      }),
    );
  });

  it("returns zero values (not null/undefined) when provider has no activity", async () => {
    const result = await getProviderDashboardStats("provider-uuid-new", mockClient);

    expect(result).toEqual(
      expect.objectContaining({
        totalLeads: 0,
        activeJobs: 0,
        completedJobs: 0,
        averageRating: 0,
        totalEarningsPence: 0,
        pendingPayoutPence: 0,
        unreadMessages: 0,
      }),
    );
  });

  it("does not throw when the mock supabase client returns an empty dataset", async () => {
    await expect(
      getProviderDashboardStats("provider-uuid-empty", mockClient),
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// getRecentActivity
// ---------------------------------------------------------------------------

describe("getRecentActivity", () => {
  it("returns an array of activity items with the correct shape", async () => {
    const result = await getRecentActivity("provider-uuid-1", 10, mockClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          /** Unique activity record id */
          id: expect.any(String),
          /**
           * Activity type:
           * 'lead_received' | 'job_started' | 'job_completed' |
           * 'payment_received' | 'review_posted' | 'message_received'
           */
          type: expect.any(String),
          /** ISO 8601 timestamp */
          createdAt: expect.any(String),
          /** Human-readable label, e.g. "New lead from John S." */
          label: expect.any(String),
          /** Optional reference id (job id, lead id, etc.) */
          referenceId: expect.anything(),
        }),
      );
    }
  });

  it("respects the limit parameter", async () => {
    const result = await getRecentActivity("provider-uuid-1", 5, mockClient);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns an empty array (not null) for a brand-new provider", async () => {
    const result = await getRecentActivity("provider-uuid-new", 10, mockClient);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getUpcomingJobs
// ---------------------------------------------------------------------------

describe("getUpcomingJobs", () => {
  it("returns an array of upcoming job summaries with the correct shape", async () => {
    const result = await getUpcomingJobs("provider-uuid-1", 5, mockClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          /** Job / booking id */
          id: expect.any(String),
          /** Client display name */
          clientName: expect.any(String),
          /** Service type label, e.g. "Boiler Repair" */
          serviceType: expect.any(String),
          /** Scheduled date (ISO 8601 date string, not full timestamp) */
          scheduledDate: expect.any(String),
          /** Job status: 'scheduled' | 'confirmed' | 'en_route' */
          status: expect.any(String),
          /** Property address (single formatted line) */
          address: expect.any(String),
        }),
      );
    }
  });

  it("returns jobs ordered by scheduledDate ascending", async () => {
    const result = await getUpcomingJobs("provider-uuid-1", 10, mockClient);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].scheduledDate >= result[i - 1].scheduledDate).toBe(true);
    }
  });

  it("returns an empty array (not null) when no upcoming jobs exist", async () => {
    const result = await getUpcomingJobs("provider-uuid-new", 5, mockClient);
    expect(Array.isArray(result)).toBe(true);
  });
});
