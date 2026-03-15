/**
 * Tests for auditedAdminAction() in src/lib/audited-admin-action.ts
 * Verifies guard integration, audit logging, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks declared before any imports
// ---------------------------------------------------------------------------

vi.mock("@/lib/admin-guard", () => ({
  adminOnly: vi.fn(),
}));

vi.mock("@/lib/admin-audit", () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("auditedAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 403 Response when adminOnly returns a Response (non-admin)", async () => {
    const { adminOnly } = await import("@/lib/admin-guard");
    vi.mocked(adminOnly).mockResolvedValue(
      Response.json({ error: "Forbidden" }, { status: 403 }),
    );

    const { auditedAdminAction } = await import(
      "@/lib/audited-admin-action"
    );
    const fn = vi.fn();
    const result = await auditedAdminAction(
      new Request("http://localhost/api/test"),
      "listing.approve",
      "listing",
      "listing-001",
      fn,
    );

    expect(result.status).toBe(403);
    expect(fn).not.toHaveBeenCalled();
  });

  it("returns Response.json(result) with success payload on happy path", async () => {
    const { adminOnly } = await import("@/lib/admin-guard");
    const mockCtx = {
      user: { id: "admin-123" },
      supabase: {},
    };
    vi.mocked(adminOnly).mockResolvedValue(mockCtx as never);

    const { auditedAdminAction } = await import(
      "@/lib/audited-admin-action"
    );
    const fn = vi.fn().mockResolvedValue({ success: true });
    const result = await auditedAdminAction(
      new Request("http://localhost/api/test"),
      "listing.approve",
      "listing",
      "listing-001",
      fn,
    );

    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body).toEqual({ success: true });
  });

  it("calls logAdminAction even when fn throws", async () => {
    const { adminOnly } = await import("@/lib/admin-guard");
    const { logAdminAction } = await import("@/lib/admin-audit");

    const mockCtx = {
      user: { id: "admin-123" },
      supabase: {},
    };
    vi.mocked(adminOnly).mockResolvedValue(mockCtx as never);

    const { auditedAdminAction } = await import(
      "@/lib/audited-admin-action"
    );
    const fn = vi.fn().mockRejectedValue(new Error("DB exploded"));

    await expect(
      auditedAdminAction(
        new Request("http://localhost/api/test"),
        "listing.approve",
        "listing",
        "listing-001",
        fn,
      ),
    ).rejects.toThrow("DB exploded");

    expect(logAdminAction).toHaveBeenCalledOnce();
    expect(logAdminAction).toHaveBeenCalledWith(
      mockCtx.supabase,
      expect.objectContaining({
        adminId: "admin-123",
        action: "listing.approve",
        targetType: "listing",
        targetId: "listing-001",
      }),
    );
  });

  it("calls logAdminAction with correct params on success", async () => {
    const { adminOnly } = await import("@/lib/admin-guard");
    const { logAdminAction } = await import("@/lib/admin-audit");

    const mockCtx = {
      user: { id: "admin-456" },
      supabase: { from: vi.fn() },
    };
    vi.mocked(adminOnly).mockResolvedValue(mockCtx as never);

    const { auditedAdminAction } = await import(
      "@/lib/audited-admin-action"
    );
    await auditedAdminAction(
      new Request("http://localhost/api/test"),
      "user.suspend",
      "user",
      "user-789",
      vi.fn().mockResolvedValue({ success: true }),
    );

    expect(logAdminAction).toHaveBeenCalledWith(
      mockCtx.supabase,
      {
        adminId: "admin-456",
        action: "user.suspend",
        targetType: "user",
        targetId: "user-789",
      },
    );
  });
});
