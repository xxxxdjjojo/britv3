import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/features", () => ({
  isFeatureEnabled: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockGetAuthenticatorAssuranceLevel = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      mfa: { getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel },
    },
    from: mockFrom,
  })),
}));

vi.stubGlobal("crypto", {
  ...crypto,
  randomUUID: vi.fn(() => "test-uuid-1234"),
});

import { proxy } from "@/proxy";
import { isFeatureEnabled } from "@/lib/features";

const mockIsFeatureEnabled = isFeatureEnabled as unknown as ReturnType<typeof vi.fn>;

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

function mockProfile(overrides: Partial<{
  active_role: string | null;
  is_admin: boolean;
  admin_role: string | null;
  provider_verification_status: string | null;
  verification_level: string | null;
}> = {}) {
  return {
    active_role: "homebuyer",
    is_admin: false,
    admin_role: null,
    provider_verification_status: null,
    verification_level: null,
    ...overrides,
  };
}

function mockProfileQuery(data: ReturnType<typeof mockProfile>) {
  mockFrom.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data, error: null }),
      })),
    })),
  });
}

describe("Middleware — JWT claims path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    // Default: no MFA challenge required so admin-route tests aren't redirected
    // to /two-factor by the MFA enforcement block in the middleware.
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal1" },
      error: null,
    });
  });

  it("uses the DB profile admin role for /admin even when JWT claims are present", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: {
            role: "homebuyer",
            plan: "",
            is_admin: false,
            admin_role: null,
          },
        },
      },
    });
    mockProfileQuery(mockProfile({
      is_admin: true,
      admin_role: "super_admin",
    }));

    const response = await proxy(createRequest("/admin/users"));

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(response.status).not.toBe(307);
  });

  it("falls back to DB calls when feature flag is OFF", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", app_metadata: {} } },
    });
    mockProfileQuery(mockProfile({ is_admin: true, admin_role: "super_admin" }));

    const response = await proxy(createRequest("/admin/dashboard"));

    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("falls back to DB calls when claims are missing (old token)", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", app_metadata: {} } },
    });
    mockProfileQuery(mockProfile({ is_admin: true, admin_role: "super_admin" }));

    const response = await proxy(createRequest("/admin/dashboard"));

    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("redirects to /forbidden when DB profile denies admin despite stale admin JWT claims", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: {
            role: "homebuyer",
            plan: "",
            is_admin: true,
            admin_role: "super_admin",
          },
        },
      },
    });
    mockProfileQuery(mockProfile({ is_admin: false, admin_role: null }));

    const response = await proxy(createRequest("/admin/users"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/forbidden");
  });

  it("redirects to /login when JWT decode fails entirely", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockRejectedValue(new Error("JWT decode failed"));

    const response = await proxy(createRequest("/admin/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("uses JWT plan claim for subscription gate when flag is ON", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: { role: "agent", plan: "agent_professional", is_admin: false },
        },
      },
    });

    const response = await proxy(createRequest("/dashboard/agent/listings"));

    // Should not query subscriptions table
    expect(mockFrom).not.toHaveBeenCalledWith("subscriptions");
    // Should pass through (not redirect to billing)
    expect(response.status).not.toBe(307);
  });

  it("redirects to billing checkout when JWT plan claim is empty and flag is ON", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: { role: "agent", plan: "", is_admin: false },
        },
      },
    });

    const response = await proxy(createRequest("/dashboard/agent/listings"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/billing/checkout/subscription");
  });

  it("uses JWT role claim for dashboard role check when flag is ON", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: { role: "homebuyer", plan: "", is_admin: false },
        },
      },
    });

    const response = await proxy(createRequest("/dashboard/homebuyer"));

    // Should not query profiles table for role check
    expect(mockFrom).not.toHaveBeenCalledWith("profiles");
  });

  it("redirects to role-select when JWT role claim is missing and flag is ON", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          // hasClaims will be false since role is undefined
          app_metadata: {},
        },
      },
    });
    // Provide DB fallback that has no active_role
    mockProfileQuery(mockProfile({ active_role: null }));

    const response = await proxy(createRequest("/dashboard/homebuyer"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/register/role-select");
  });
});
