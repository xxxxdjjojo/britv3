import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/features", () => ({
  isFeatureEnabled: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.stubGlobal("crypto", {
  ...crypto,
  randomUUID: vi.fn(() => "test-uuid-1234"),
});

import { middleware } from "@/middleware";
import { isFeatureEnabled } from "@/lib/features";

const mockIsFeatureEnabled = isFeatureEnabled as unknown as ReturnType<typeof vi.fn>;

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

describe("Middleware — JWT claims path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("uses JWT claims for admin check when feature flag is ON", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: { role: "agent", plan: "agent_professional", is_admin: true },
        },
      },
    });

    const response = await middleware(createRequest("/admin/dashboard"));

    expect(mockFrom).not.toHaveBeenCalledWith("profiles");
    expect(response.status).not.toBe(307);
  });

  it("falls back to DB calls when feature flag is OFF", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", app_metadata: {} } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
        })),
      })),
    });

    const response = await middleware(createRequest("/admin/dashboard"));

    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("falls back to DB calls when claims are missing (old token)", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", app_metadata: {} } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
        })),
      })),
    });

    const response = await middleware(createRequest("/admin/dashboard"));

    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("redirects to /forbidden when JWT claims say is_admin is false", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          app_metadata: { role: "homebuyer", plan: "", is_admin: false },
        },
      },
    });

    const response = await middleware(createRequest("/admin/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/forbidden");
  });

  it("redirects to /login when JWT decode fails entirely", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetUser.mockRejectedValue(new Error("JWT decode failed"));

    const response = await middleware(createRequest("/admin/dashboard"));
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

    const response = await middleware(createRequest("/dashboard/agent/listings"));

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

    const response = await middleware(createRequest("/dashboard/agent/listings"));

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

    const response = await middleware(createRequest("/dashboard/homebuyer"));

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
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { active_role: null }, error: null }),
        })),
      })),
    });

    const response = await middleware(createRequest("/dashboard/homebuyer"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/register/role-select");
  });
});
