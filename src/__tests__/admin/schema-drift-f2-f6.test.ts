/**
 * Schema-reconciliation regression tests for F2-F6.
 *
 * Each bug was an app query referencing a column/value that does not exist in
 * the real Postgres schema (verified against a local `supabase db reset`). The
 * authoritative columns are:
 *   F2 email_campaigns.content : jsonb NOT NULL  (cannot accept "" — invalid JSON)
 *   F3 profiles                : display_name (no full_name/email/role)
 *   F4 listings.status         : enum draft|active|under_offer|sold|let|...
 *                                moderation outcomes live in listing_moderation
 *   F5 subscriptions.plan_name : (not "plan")
 *   F6 properties.address_line1: (not "address_line_1")
 *
 * These assert on the column NAMES the services pass to Supabase, so they fail
 * RED against the pre-fix code and pass GREEN after the query fixes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Chainable query-builder mock (mirrors src/__tests__/admin/user-service.test.ts)
// ---------------------------------------------------------------------------

type TerminalResult = { data: unknown; error: unknown; count?: number | null };

function createChain(terminalResult: TerminalResult) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "insert", "update", "eq", "ilike", "range", "order", "or", "single"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // .single() resolves to the terminal result directly.
  chain.single = vi.fn().mockResolvedValue(terminalResult);
  chain.then = (
    resolve: (v: { data: unknown; error: unknown; count: number | null }) => void,
  ) => {
    resolve({ ...terminalResult, count: terminalResult.count ?? 0 });
    return { catch: vi.fn() };
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// F2: email_campaigns.content is jsonb NOT NULL — the POST route must not insert
// a bare "" (invalid JSON). It must insert a JSON value.
// ---------------------------------------------------------------------------

describe("F2 admin/campaigns POST inserts valid jsonb content", () => {
  it("passes a JSON object (not a bare string) to email_campaigns.content", async () => {
    let insertPayload: Record<string, unknown> | undefined;
    const insertChain = {
      insert: vi.fn((payload: Record<string, unknown>) => {
        insertPayload = payload;
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null }),
          }),
        };
      }),
    };
    const supabase = { from: vi.fn().mockReturnValue(insertChain) };

    // Mock the audited wrapper to immediately run the action with our spy client.
    vi.doMock("@/lib/audited-admin-action", () => ({
      AdminActionError: class extends Error {},
      auditedAdminActionWithPermission: vi.fn(
        async (
          _req: unknown,
          _action: string,
          _entity: string,
          _id: string,
          _perm: string,
          fn: (ctx: { supabase: unknown }) => Promise<unknown>,
        ) => {
          const result = await fn({ supabase });
          return Response.json(result);
        },
      ),
    }));

    const { POST } = await import("@/app/api/admin/campaigns/route");
    const req = new Request("http://t/api/admin/campaigns", {
      method: "POST",
      body: JSON.stringify({ name: "Spring", subject: "Hi" }),
    });

    await POST(req);

    expect(insertPayload).toBeDefined();
    const content = insertPayload!.content;
    expect(typeof content).toBe("object");
    expect(content).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// F5: subscriptions — real column is plan_name, not plan
// ---------------------------------------------------------------------------

describe("F5 subscription-service.getSubscriptions", () => {
  it("selects plan_name (not plan) from subscriptions", async () => {
    const { getSubscriptions } = await import("@/services/admin/subscription-service");
    const chain = createChain({ data: [], error: null });
    const selectSpy = chain.select as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await getSubscriptions(supabase as never);

    const selectArg = selectSpy.mock.calls[0][0] as string;
    expect(selectArg).toContain("plan_name");
    expect(selectArg).not.toMatch(/(^|[\s,])plan([\s,]|$)/);
  });

  it("maps plan_name onto the AdminSubscription.plan field", async () => {
    const { getSubscriptions } = await import("@/services/admin/subscription-service");
    const chain = createChain({
      data: [{ id: "s1", user_id: "u1", plan_name: "pro", status: "active", created_at: "2026-01-01" }],
      error: null,
    });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    const rows = await getSubscriptions(supabase as never);

    expect(rows[0].plan).toBe("pro");
  });
});

describe("F5 gdpr-fulfillment-service.aggregateUserData (subscriptions)", () => {
  it("selects plan_name (not plan) from subscriptions", async () => {
    const calls: string[] = [];
    const makeChain = () => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn((arg: string) => {
        calls.push(arg);
        return chain;
      });
      // .eq() is awaited directly for list queries and chained to .single() for
      // the profile fetch — support both shapes.
      const result = { data: [], error: null, count: 0 };
      const eqReturn = {
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: (resolve: (v: typeof result) => void) => {
          resolve(result);
          return { catch: vi.fn() };
        },
      };
      chain.eq = vi.fn().mockReturnValue(eqReturn);
      return chain;
    };
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn(() => ({ from: vi.fn(() => makeChain()) })),
    }));

    const { aggregateUserData } = await import("@/services/admin/gdpr-fulfillment-service");
    await aggregateUserData("user-1");

    const subSelect = calls.find((c) => c.includes("status") && (c.includes("plan") || c.includes("plan_name")));
    expect(subSelect).toBeDefined();
    expect(subSelect).toContain("plan_name");
  });
});

// ---------------------------------------------------------------------------
// F6: properties — real column is address_line1, not address_line_1, and the
// address columns live on `properties`, not `listings`. getPropertyDetail must
// select them through the properties FK and map address_line1 -> address_line_1.
// ---------------------------------------------------------------------------

describe("F6 portfolio-service.getPropertyDetail", () => {
  function buildSupabase(listing: unknown) {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn((arg: string) => {
      (buildSupabase as unknown as { lastSelect?: string }).lastSelect = arg;
      return chain;
    });
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: listing, error: null });
    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
      from: vi.fn().mockReturnValue(chain),
      _chain: chain,
    };
  }

  it("selects address_line1 (not address_line_1) through the properties FK", async () => {
    const supabase = buildSupabase({ id: "l1", properties: null, tenancies: [], maintenance_requests: [], property_documents: [] });
    const { getPropertyDetail } = await import("@/services/landlord/portfolio-service");

    await getPropertyDetail(supabase as never, "l1");

    const selectArg = (supabase._chain.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(selectArg).toContain("address_line1");
    expect(selectArg).not.toContain("address_line_1");
    expect(selectArg).toContain("properties");
  });

  it("maps properties.address_line1 onto the address_line_1 output field", async () => {
    const supabase = buildSupabase({
      id: "l1",
      properties: {
        address_line1: "1 Real Street",
        address_line2: null,
        city: "London",
        postcode: "E1 6AN",
        property_type: "flat",
        bedrooms: 2,
        bathrooms: 1,
      },
      tenancies: [],
      maintenance_requests: [],
      property_documents: [],
    });
    const { getPropertyDetail } = await import("@/services/landlord/portfolio-service");

    const detail = await getPropertyDetail(supabase as never, "l1");

    expect(detail.address_line_1).toBe("1 Real Street");
    expect(detail.city).toBe("London");
  });
});

// ---------------------------------------------------------------------------
// F3: profiles — verification queue must select display_name (no full_name/email)
// ---------------------------------------------------------------------------

describe("F3 verification-service.getVerificationQueue", () => {
  it("selects display_name and not full_name/email from profiles", async () => {
    const { getVerificationQueue } = await import("@/services/admin/verification-service");
    const chain = createChain({ data: [], error: null });
    const selectSpy = chain.select as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await getVerificationQueue(supabase as never);

    const selectArg = selectSpy.mock.calls[0][0] as string;
    expect(selectArg).toContain("display_name");
    expect(selectArg).not.toContain("full_name");
    expect(selectArg).not.toMatch(/(^|[\s,])email([\s,]|$)/);
  });

  it("derives a display name from display_name into the full_name field", async () => {
    const { getVerificationQueue } = await import("@/services/admin/verification-service");
    const chain = createChain({
      data: [
        {
          id: "u1",
          display_name: "Jane Provider",
          provider_verification_status: "pending",
          provider_details: null,
          created_at: "2026-01-01",
        },
      ],
      error: null,
    });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    const rows = await getVerificationQueue(supabase as never);

    expect(rows[0].full_name).toBe("Jane Provider");
  });

  it("filters on provider_verification_status, not the non-existent verification_status", async () => {
    const { getVerificationQueue } = await import("@/services/admin/verification-service");
    const chain = createChain({ data: [], error: null });
    const eqSpy = chain.eq as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await getVerificationQueue(supabase as never);

    const [col] = eqSpy.mock.calls[0] as [string, unknown];
    expect(col).toBe("provider_verification_status");
  });
});

// ---------------------------------------------------------------------------
// F4: moderation status lives on listing_moderation, listings.status is an enum
// without 'rejected'/'flagged'. The listing service must not write those values
// to a non-existent properties.status column.
// ---------------------------------------------------------------------------

describe("F4 listing-service moderation", () => {
  it("getListingQueue reads listings (with status) joined to property title, not properties.status", async () => {
    const { getListingQueue } = await import("@/services/admin/listing-service");
    const chain = createChain({ data: [], error: null, count: 0 });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await getListingQueue(supabase as never);

    const fromArg = (supabase.from as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fromArg).toBe("listings");
  });

  it("rejectListing records the outcome in listing_moderation (not properties.status='rejected')", async () => {
    const { rejectListing } = await import("@/services/admin/listing-service");
    const chain = createChain({ data: null, error: null });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await rejectListing(supabase as never, "l1", "spam");

    const tables = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(tables).toContain("listing_moderation");
    expect(tables).not.toContain("properties");
  });

  it("flagListing records the outcome in listing_moderation", async () => {
    const { flagListing } = await import("@/services/admin/listing-service");
    const chain = createChain({ data: null, error: null });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await flagListing(supabase as never, "l1", "dodgy");

    const tables = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(tables).toContain("listing_moderation");
  });
});
