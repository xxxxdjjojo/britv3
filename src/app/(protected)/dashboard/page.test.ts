import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, redirectMock, getUserMock, singleMock, selectMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    }),
    getUserMock: vi.fn(),
    singleMock: vi.fn(),
    selectMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({
      eq: vi.fn(() => ({
        single: singleMock,
      })),
    });
    createClientMock.mockResolvedValue({
      auth: {
        getUser: getUserMock,
      },
      from: vi.fn(() => ({
        select: selectMock,
      })),
    });
  });

  async function renderPage() {
    const { default: DashboardPage } = await import("./page");
    return DashboardPage();
  }

  it("redirects unauthenticated users to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    await expect(renderPage()).rejects.toThrow("redirect:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects configured admins to /admin rather than their product dashboard", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    singleMock.mockResolvedValue({
      data: {
        active_role: "homebuyer",
        is_admin: true,
        admin_role: "super_admin",
      },
      error: null,
    });

    await expect(renderPage()).rejects.toThrow("redirect:/admin");
    expect(selectMock).toHaveBeenCalledWith("active_role, is_admin, admin_role");
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("redirects incomplete admin profiles to forbidden", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    singleMock.mockResolvedValue({
      data: {
        active_role: "homebuyer",
        is_admin: true,
        admin_role: null,
      },
      error: null,
    });

    await expect(renderPage()).rejects.toThrow("redirect:/forbidden");
    expect(redirectMock).toHaveBeenCalledWith("/forbidden");
  });

  it("redirects non-admin product users to their canonical role dashboard", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "provider-1" } },
      error: null,
    });
    singleMock.mockResolvedValue({
      data: {
        active_role: "service_provider",
        is_admin: false,
        admin_role: null,
      },
      error: null,
    });

    await expect(renderPage()).rejects.toThrow("redirect:/dashboard/provider");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/provider");
  });
});
