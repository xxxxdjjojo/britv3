import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// Mock Supabase createClient
const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockProfileSelect,
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe("FOUND-02 — role route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation(() => {
      throw new Error("REDIRECT");
    });
  });

  it("redirects unauthenticated user to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    // Dynamically import layout to pick up mocks
    const { default: RoleDashboardLayout } = await import(
      "@/app/(protected)/dashboard/[role]/layout"
    );

    await expect(
      RoleDashboardLayout({
        children: null,
        params: Promise.resolve({ role: "homebuyer" }),
      }),
    ).rejects.toThrow("REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects homebuyer from /dashboard/landlord to /dashboard/homebuyer", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({
      data: { active_role: "homebuyer" },
      error: null,
    });

    const { default: RoleDashboardLayout } = await import(
      "@/app/(protected)/dashboard/[role]/layout"
    );

    await expect(
      RoleDashboardLayout({
        children: null,
        params: Promise.resolve({ role: "landlord" }),
      }),
    ).rejects.toThrow("REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/homebuyer");
  });

  it("allows homebuyer to access /dashboard/homebuyer", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({
      data: { active_role: "homebuyer" },
      error: null,
    });

    const { default: RoleDashboardLayout } = await import(
      "@/app/(protected)/dashboard/[role]/layout"
    );

    // Should NOT redirect — should render children
    const result = await RoleDashboardLayout({
      children: "content",
      params: Promise.resolve({ role: "homebuyer" }),
    });

    expect(mockRedirect).not.toHaveBeenCalledWith("/dashboard/homebuyer");
    expect(result).toBeDefined();
  });

  it("allows mortgage brokers to access the canonical /dashboard/broker slug", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "broker-123" } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({
      data: { active_role: "mortgage_broker" },
      error: null,
    });

    const { default: RoleDashboardLayout } = await import(
      "@/app/(protected)/dashboard/[role]/layout"
    );

    const result = await RoleDashboardLayout({
      children: "broker content",
      params: Promise.resolve({ role: "broker" }),
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("redirects service providers to the canonical /dashboard/provider slug", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "provider-123" } },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({
      data: { active_role: "service_provider" },
      error: null,
    });

    const { default: RoleDashboardLayout } = await import(
      "@/app/(protected)/dashboard/[role]/layout"
    );

    await expect(
      RoleDashboardLayout({
        children: null,
        params: Promise.resolve({ role: "homebuyer" }),
      }),
    ).rejects.toThrow("REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/provider");
  });
});
