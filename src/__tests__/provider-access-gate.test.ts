import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClientMock, isFeatureEnabledMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  isFeatureEnabledMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/features", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

function query(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function providerSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "provider-1",
            email_confirmed_at: "2026-07-01T00:00:00Z",
            app_metadata: {
              role: "service_provider",
              plan: "provider_pro",
            },
          },
        },
        error: null,
      }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: "aal1", nextLevel: "aal1" },
          error: null,
        }),
      },
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return query({
          active_role: "service_provider",
          is_admin: false,
          admin_role: null,
          provider_verification_status: "verified",
          verification_level: "professional",
        });
      }
      if (table === "subscriptions") {
        return query({ status: "active", role: "provider" });
      }
      if (table === "stripe_connect_accounts") {
        return query({ charges_enabled: true, payouts_enabled: true });
      }
      return query(null);
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{
        peer_count: 2,
        client_count: 3,
        grandfathered: false,
        gate_complete: false,
      }],
      error: null,
    }),
  };
}

// A genuine service_provider mid-onboarding: JWT claims say provider, but no
// profiles/vouch rows exist yet. This must be an onboarding state, not a 503
// that dead-ends every provider route.
function onboardingProviderSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "provider-1",
            email_confirmed_at: "2026-07-01T00:00:00Z",
            app_metadata: { role: "service_provider", plan: "provider_pro" },
          },
        },
        error: null,
      }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: "aal1", nextLevel: "aal1" },
          error: null,
        }),
      },
    },
    from: vi.fn(() => query(null)),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
}

beforeEach(() => {
  vi.resetModules();
  createServerClientMock.mockReset();
  isFeatureEnabledMock.mockReturnValue(true);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  delete process.env.VOUCH_GATE_BYPASS;
});

describe("provider dashboard access", () => {
  it("confines an incomplete provider even when JWT role and plan claims are present", async () => {
    createServerClientMock.mockReturnValue(providerSupabase());
    const { proxy } = await import("../proxy");

    const response = await proxy(
      new NextRequest("https://truedeed.test/dashboard/provider/jobs/leads"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/dashboard/provider/verification",
    );
  });

  it("fails closed for a protected provider route when Supabase is unconfigured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { proxy } = await import("../proxy");
    const response = await proxy(
      new NextRequest("https://truedeed.test/dashboard/provider/jobs/leads"),
    );
    expect(response.status).toBe(503);
  });

  it("lets a provider mid-onboarding (no profile row) self-recover on the safe verification path", async () => {
    createServerClientMock.mockReturnValue(onboardingProviderSupabase());
    const { proxy } = await import("../proxy");

    const response = await proxy(
      new NextRequest("https://truedeed.test/dashboard/provider/verification"),
    );

    // Not a 503 dead-end: the safe onboarding surface stays reachable
    // (allowed through — no redirect away).
    expect(response.status).not.toBe(503);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still confines a provider mid-onboarding (no profile row) away from business paths", async () => {
    createServerClientMock.mockReturnValue(onboardingProviderSupabase());
    const { proxy } = await import("../proxy");

    const response = await proxy(
      new NextRequest("https://truedeed.test/dashboard/provider/jobs/leads"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/dashboard/provider/verification",
    );
  });

  it("keeps the public authentication callback reachable even with a session", async () => {
    const supabase = providerSupabase();
    createServerClientMock.mockReturnValue(supabase);
    const { proxy } = await import("../proxy");
    const response = await proxy(
      new NextRequest("https://truedeed.test/auth/callback?code=oauth-code"),
    );
    expect(response.status).toBe(200);
  });
});
