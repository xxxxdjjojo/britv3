import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Sibling test to middleware-public-routes.test.ts.
 *
 * Covers the subscription gate block of src/middleware.ts (lines ~411-493):
 *   - Authenticated user with no `app_metadata.plan` hitting a gated route
 *     is redirected to /dashboard/{role}/billing/checkout/subscription.
 *   - Billing pages and the referrals page are exempt and pass through.
 *   - The DB subscription query fail-open path captures to Sentry and lets
 *     the request through (per the deliberate fail-open behaviour documented
 *     in code comments).
 *
 * Notes:
 *   - The JWT-claims fast-path is enabled when `appMetadata.role` is set in
 *     `app_metadata`. We use that path for the redirect/exempt tests so the
 *     middleware doesn't try to read the `profiles` table.
 *   - For the DB fail-open test we leave `app_metadata` empty so the
 *     middleware falls through to the Supabase `from("subscriptions")` query
 *     and we can simulate it throwing.
 */

const { createServerClientMock, captureExceptionMock, isFeatureEnabledMock } =
  vi.hoisted(() => ({
    createServerClientMock: vi.fn(),
    captureExceptionMock: vi.fn(),
    isFeatureEnabledMock: vi.fn(),
  }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: captureExceptionMock,
}));

vi.mock("@/lib/features", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AppMetadata = {
  role?: string;
  plan?: string;
  is_admin?: boolean;
  admin_role?: string;
};

type SubscriptionRow = { status?: string; plan_name?: string } | null;

type SubscriptionQueryOutcome =
  | { kind: "ok"; row: SubscriptionRow }
  | { kind: "error"; error: { message: string } }
  | { kind: "throw"; error: Error };

type MockOptions = {
  user: { id: string; app_metadata?: AppMetadata } | null;
  subscription?: SubscriptionQueryOutcome;
  profile?: { data: unknown; error: unknown };
};

function buildSupabaseMock(opts: MockOptions) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: opts.user },
    error: null,
  });

  const mfa = {
    getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal1" },
      error: null,
    }),
  };

  // Subscription query: from("subscriptions").select(...).eq(...).maybeSingle()
  // We also need a profiles query because the middleware fetches profiles
  // before the subscription block when JWT claims are missing.
  const subscriptionOutcome = opts.subscription;
  const subscriptionMaybeSingle = vi.fn().mockImplementation(async () => {
    if (!subscriptionOutcome || subscriptionOutcome.kind === "ok") {
      return { data: subscriptionOutcome?.row ?? null, error: null };
    }
    if (subscriptionOutcome.kind === "error") {
      return { data: null, error: subscriptionOutcome.error };
    }
    // "throw"
    throw subscriptionOutcome.error;
  });
  const subscriptionEq = vi.fn(() => ({ maybeSingle: subscriptionMaybeSingle }));
  const subscriptionSelect = vi.fn(() => ({ eq: subscriptionEq }));

  const profileSingle = vi.fn().mockResolvedValue(
    opts.profile ?? { data: { active_role: "agent", is_admin: false, admin_role: null, provider_verification_status: null, verification_level: "professional" }, error: null },
  );
  const profileEq = vi.fn(() => ({ single: profileSingle }));
  const profileSelect = vi.fn(() => ({ eq: profileEq }));

  const from = vi.fn((table: string) => {
    if (table === "subscriptions") {
      return { select: subscriptionSelect };
    }
    if (table === "profiles") {
      return { select: profileSelect };
    }
    return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) };
  });

  return {
    supabase: {
      auth: { getUser, mfa },
      from,
    },
    spies: {
      getUser,
      subscriptionSelect,
      subscriptionMaybeSingle,
    },
  };
}

function makeRequest(
  pathname: string,
  init?: { cookies?: Record<string, string> },
): NextRequest {
  const url = new URL(pathname, "https://britestate.test");
  const headers = new Headers();
  if (init?.cookies) {
    headers.set(
      "cookie",
      Object.entries(init.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    );
  }
  return new NextRequest(url, { headers });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetModules();
  createServerClientMock.mockReset();
  captureExceptionMock.mockReset();
  isFeatureEnabledMock.mockReset();
  // JWT claims fast path ON by default — keeps tests free of profile-table mocking.
  isFeatureEnabledMock.mockReturnValue(true);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
});

describe("middleware: subscription gate", () => {
  it("redirects authenticated user without app_metadata.plan to billing checkout", async () => {
    // Arrange — user has role claim but NO plan claim
    const { supabase } = buildSupabaseMock({
      user: {
        id: "user-1",
        app_metadata: { role: "agent", is_admin: false, admin_role: undefined },
      },
    });
    createServerClientMock.mockReturnValue(supabase);

    // Act
    const { proxy } = await import("../proxy");
    const response = await proxy(makeRequest("/dashboard/agent/leads"));

    // Assert
    expect(response.status).toBe(307); // NextResponse.redirect → 307
    const location = response.headers.get("location");
    expect(location).toContain("/dashboard/agent/billing/checkout/subscription");
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("allows authenticated user without plan to access billing pages (exempt)", async () => {
    // Arrange
    const { supabase } = buildSupabaseMock({
      user: {
        id: "user-1",
        app_metadata: { role: "agent" },
      },
    });
    createServerClientMock.mockReturnValue(supabase);

    // Act
    const { proxy } = await import("../proxy");
    const response = await proxy(
      makeRequest("/dashboard/agent/billing/checkout/subscription"),
    );

    // Assert — passes through (NextResponse.next → 200, no Location)
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows authenticated user without plan to access referrals page (exempt)", async () => {
    // Arrange
    const { supabase } = buildSupabaseMock({
      user: {
        id: "user-1",
        app_metadata: { role: "agent" },
      },
    });
    createServerClientMock.mockReturnValue(supabase);

    // Act
    const { proxy } = await import("../proxy");
    const response = await proxy(makeRequest("/dashboard/agent/referrals"));

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("fail-open: subscription DB query throws → captureException called, request passes through", async () => {
    // Arrange — JWT claims OFF so middleware takes the DB path. Provide a
    // profile so the dashboard-route profile fetch doesn't redirect to /login,
    // then make the subscription query throw.
    isFeatureEnabledMock.mockReturnValue(false);

    const { supabase, spies } = buildSupabaseMock({
      user: {
        id: "user-1",
        // No app_metadata.role — middleware will fall through to DB profile lookup.
      },
      profile: {
        data: {
          active_role: "agent",
          is_admin: false,
          admin_role: null,
          provider_verification_status: "verified",
          verification_level: "professional",
        },
        error: null,
      },
      subscription: {
        kind: "throw",
        error: new Error("subscriptions table missing"),
      },
    });
    createServerClientMock.mockReturnValue(supabase);

    // Act
    const { proxy } = await import("../proxy");
    const response = await proxy(makeRequest("/dashboard/agent/leads"));

    // Assert — fail-open: request passes through with 200.
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    // Sentry capture is wired with module=kernel, feature=middleware.
    expect(captureExceptionMock).toHaveBeenCalled();
    const captureCall = captureExceptionMock.mock.calls.find(
      ([, ctx]) =>
        (ctx as { feature?: string })?.feature === "middleware" &&
        (ctx as { module?: string })?.module === "kernel",
    );
    expect(captureCall).toBeDefined();
    expect(captureCall?.[1]).toEqual(
      expect.objectContaining({
        module: "kernel",
        feature: "middleware",
        operation: expect.stringContaining("subscriptions"),
      }),
    );
    // Confirm the throwing query path actually executed.
    expect(spies.subscriptionMaybeSingle).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Provider "open" sections — product decision 2026-06-27.
//
// Service providers can use Jobs, Quotes, Reviews and Earnings BEFORE they
// subscribe or finish verification, so a new provider can explore and build
// quotes before paying. These four sections must therefore pass BOTH gates
// (verification + subscription) even when the provider has no plan / is not
// verified. Every OTHER provider section stays gated.
// ---------------------------------------------------------------------------

describe("middleware: provider-open sections bypass the gates", () => {
  const OPEN_PATHS = [
    "/dashboard/provider/jobs/leads",
    "/dashboard/provider/jobs/active",
    "/dashboard/provider/jobs/completed",
    "/dashboard/provider/quotes",
    "/dashboard/provider/quotes/builder",
    "/dashboard/provider/reviews",
    "/dashboard/provider/payments",
  ];

  // ── Subscription gate (JWT-claims path: provider has role but no plan) ────
  for (const path of OPEN_PATHS) {
    it(`subscription gate: provider without a plan can access ${path}`, async () => {
      const { supabase } = buildSupabaseMock({
        user: { id: "prov-1", app_metadata: { role: "service_provider" } },
      });
      createServerClientMock.mockReturnValue(supabase);

      const { proxy } = await import("../proxy");
      const response = await proxy(makeRequest(path));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  }

  it("subscription gate: a NON-open provider section still redirects to checkout", async () => {
    const { supabase } = buildSupabaseMock({
      user: { id: "prov-1", app_metadata: { role: "service_provider" } },
    });
    createServerClientMock.mockReturnValue(supabase);

    const { proxy } = await import("../proxy");
    const response = await proxy(makeRequest("/dashboard/provider/analytics"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/dashboard/provider/billing/checkout/subscription",
    );
  });

  // ── Verification gate (DB path: provider unverified, no JWT claims) ───────
  it("verification gate: an UNVERIFIED provider can access an open section (quotes)", async () => {
    isFeatureEnabledMock.mockReturnValue(false); // force DB path → verification gate runs
    const { supabase } = buildSupabaseMock({
      user: { id: "prov-1" }, // no app_metadata.role → DB profile lookup
      profile: {
        data: {
          active_role: "service_provider",
          is_admin: false,
          admin_role: null,
          provider_verification_status: "unverified",
          verification_level: "basic",
        },
        error: null,
      },
      // Active sub so only the verification gate is under test here.
      subscription: { kind: "ok", row: { status: "active", plan_name: "Pro" } },
    });
    createServerClientMock.mockReturnValue(supabase);

    const { proxy } = await import("../proxy");
    const response = await proxy(
      makeRequest("/dashboard/provider/quotes/builder"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("verification gate: an UNVERIFIED provider is still blocked from a NON-open section", async () => {
    isFeatureEnabledMock.mockReturnValue(false);
    const { supabase } = buildSupabaseMock({
      user: { id: "prov-1" },
      profile: {
        data: {
          active_role: "service_provider",
          is_admin: false,
          admin_role: null,
          provider_verification_status: "unverified",
          verification_level: "basic",
        },
        error: null,
      },
      subscription: { kind: "ok", row: { status: "active", plan_name: "Pro" } },
    });
    createServerClientMock.mockReturnValue(supabase);

    const { proxy } = await import("../proxy");
    const response = await proxy(makeRequest("/dashboard/provider/analytics"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/dashboard/provider/verification",
    );
  });
});
