/**
 * Tests for admin user management functions in src/services/admin/user-service.ts
 * Covers: searchUsers sanitization, suspendUser auth ban + rollback, activateUser.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/admin so createAdminClient() doesn't need env vars
// ---------------------------------------------------------------------------

const mockAuthAdmin = {
  updateUserById: vi.fn(),
  getUserById: vi.fn(async (id: string) => ({
    data: { user: { id, email: `${id}@example.com` } },
    error: null,
  })),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: mockAuthAdmin,
    },
  })),
}));

// ---------------------------------------------------------------------------
// Helper: chainable query builder
// ---------------------------------------------------------------------------

function createChain(terminalResult: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "update", "eq", "ilike", "range", "order", "or"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // Attach a .then so await works on the chain directly
  chain.then = (
    resolve: (v: { data: unknown; error: unknown; count: number | null }) => void,
  ) => {
    resolve({ ...terminalResult, count: terminalResult.count ?? 0 });
    return { catch: vi.fn() };
  };
  return chain;
}

// ---------------------------------------------------------------------------
// Tests: searchUsers
// ---------------------------------------------------------------------------

describe("searchUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls ilike with sanitized query (strips % and _ characters)", { timeout: 15000 }, async () => {
    const { searchUsers } = await import("@/services/admin/user-service");

    const chain = createChain({ data: [], error: null });
    const ilikeSpy = chain.ilike as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await searchUsers(supabase as never, "foo%bar_baz", 0, 10);

    expect(ilikeSpy).toHaveBeenCalledOnce();
    const [col, pattern] = ilikeSpy.mock.calls[0] as [string, string];
    expect(col).toBe("display_name");
    // sanitizePostgrestInput strips % and _ characters
    expect(pattern).not.toContain("%bar");
    expect(pattern).not.toContain("_baz");
    expect(pattern).toContain("foobarbaz");
  });

  it("truncates query longer than 100 characters", async () => {
    const { searchUsers } = await import("@/services/admin/user-service");

    const longQuery = "a".repeat(200);
    const chain = createChain({ data: [], error: null });
    const ilikeSpy = chain.ilike as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await searchUsers(supabase as never, longQuery, 0, 10);

    const [, pattern] = ilikeSpy.mock.calls[0] as [string, string];
    // Pattern is %{sanitized}% so sanitized part <= 100 chars
    const inner = pattern.slice(1, -1); // strip leading/trailing %
    expect(inner.length).toBeLessThanOrEqual(100);
  });

  it("returns empty array on DB error", async () => {
    const { searchUsers } = await import("@/services/admin/user-service");

    const chain = createChain({ data: null, error: { message: "DB error" } });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    const result = await searchUsers(supabase as never, "test", 0, 10);
    expect(result).toEqual({ users: [], total: 0 });
  });

  it("populates email from auth.users by looking up each displayed id", async () => {
    const { searchUsers } = await import("@/services/admin/user-service");

    const rows = [
      { id: "u1", display_name: "Alice", active_role: "homebuyer", is_admin: false, suspended_until: null, banned_at: null, created_at: "2026-01-01" },
      { id: "u2", display_name: "Bob", active_role: "seller", is_admin: false, suspended_until: null, banned_at: null, created_at: "2026-01-02" },
    ];
    const chain = createChain({ data: rows, error: null, count: 2 });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    const result = await searchUsers(supabase as never, "", 0, 20);

    // One lookup per displayed row (not a global listUsers cap)
    expect(mockAuthAdmin.getUserById).toHaveBeenCalledTimes(2);
    expect(mockAuthAdmin.getUserById).toHaveBeenCalledWith("u1");
    expect(mockAuthAdmin.getUserById).toHaveBeenCalledWith("u2");
    expect(result.users.find((u) => u.id === "u1")?.email).toBe("u1@example.com");
    expect(result.users.find((u) => u.id === "u2")?.email).toBe("u2@example.com");
  });

  it("leaves email null when the admin client lookup throws (no crash)", async () => {
    mockAuthAdmin.getUserById.mockRejectedValueOnce(new Error("service role unavailable"));
    const { searchUsers } = await import("@/services/admin/user-service");

    const rows = [
      { id: "u9", display_name: "Zoe", active_role: "homebuyer", is_admin: false, suspended_until: null, banned_at: null, created_at: "2026-01-01" },
    ];
    const chain = createChain({ data: rows, error: null, count: 1 });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    const result = await searchUsers(supabase as never, "", 0, 20);
    expect(result.users[0]?.email).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: suspendUser
// ---------------------------------------------------------------------------

describe("suspendUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockAuthAdmin.updateUserById.mockResolvedValue({ error: null });
  });

  function createSuspendSupabase(opts?: {
    updateError?: { message: string } | null;
  }) {
    const chain: Record<string, unknown> = {};
    chain.update = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockResolvedValue({ error: opts?.updateError ?? null });
    return {
      supabase: { from: vi.fn().mockReturnValue(chain) } as unknown,
      chain,
    };
  }

  it("sets suspended_until in profiles table", async () => {
    const { suspendUser } = await import("@/services/admin/user-service");
    const { supabase, chain } = createSuspendSupabase();

    await suspendUser(supabase as never, "user-001");

    const updateArg = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg).toHaveProperty("suspended_until");
    expect(typeof updateArg.suspended_until).toBe("string");
  });

  it("calls auth.admin.updateUserById with ban_duration to block login", async () => {
    const { suspendUser } = await import("@/services/admin/user-service");
    const { supabase } = createSuspendSupabase();

    const result = await suspendUser(supabase as never, "user-001");

    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith("user-001", {
      ban_duration: "876600h",
    });
    expect(result.success).toBe(true);
  });

  it("accepts duration parameter and uses correct ban_duration", async () => {
    const { suspendUser } = await import("@/services/admin/user-service");
    const { supabase } = createSuspendSupabase();

    await suspendUser(supabase as never, "user-001", "24h");

    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith("user-001", {
      ban_duration: "24h",
    });
  });

  it("rolls back suspended_until if auth ban fails", async () => {
    mockAuthAdmin.updateUserById.mockResolvedValue({
      error: { message: "Auth service unavailable" },
    });

    const { suspendUser } = await import("@/services/admin/user-service");

    const updateCalls: Array<Record<string, unknown>> = [];
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockImplementation((payload) => {
      updateCalls.push(payload as Record<string, unknown>);
      return { eq: eqMock };
    });
    const supabase = {
      from: vi.fn().mockReturnValue({ update: updateMock }),
    };

    const result = await suspendUser(supabase as never, "user-001");

    expect(result.success).toBe(false);
    // First call sets suspended_until, second call rolls back to null
    expect(updateCalls[0]).toHaveProperty("suspended_until");
    expect(updateCalls[1]).toEqual({ suspended_until: null });
  });

  it("returns success=false immediately if DB update fails (no auth call)", async () => {
    const { suspendUser } = await import("@/services/admin/user-service");

    const eqMock = vi.fn().mockResolvedValue({
      error: { message: "DB constraint" },
    });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    };

    const result = await suspendUser(supabase as never, "user-001");

    expect(result.success).toBe(false);
    expect(mockAuthAdmin.updateUserById).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: activateUser
// ---------------------------------------------------------------------------

describe("activateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockAuthAdmin.updateUserById.mockResolvedValue({ error: null });
  });

  it("calls auth.admin.updateUserById with ban_duration=none to unban", async () => {
    const { activateUser } = await import("@/services/admin/user-service");

    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    };

    const result = await activateUser(supabase as never, "user-001");

    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith("user-001", {
      ban_duration: "none",
    });
    expect(result.success).toBe(true);
  });

  it("rolls back suspended_until if auth unban fails", async () => {
    mockAuthAdmin.updateUserById.mockResolvedValue({
      error: { message: "Auth service unavailable" },
    });

    const { activateUser } = await import("@/services/admin/user-service");

    const updateCalls: Array<Record<string, unknown>> = [];
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockImplementation((payload) => {
      updateCalls.push(payload as Record<string, unknown>);
      return { eq: eqMock };
    });
    const supabase = {
      from: vi.fn().mockReturnValue({ update: updateMock }),
    };

    const result = await activateUser(supabase as never, "user-001");

    expect(result.success).toBe(false);
    // First call clears suspension, second rolls back
    expect(updateCalls[0]).toHaveProperty("suspended_until", null);
    expect(updateCalls[1]).toHaveProperty("suspended_until");
  });
});
