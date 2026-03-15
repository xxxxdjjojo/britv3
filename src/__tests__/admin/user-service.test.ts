/**
 * Tests for admin user management functions in src/services/admin-service.ts
 * Covers: searchUsers sanitization, suspendUser auth ban + rollback.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/admin so createAdminClient() doesn't need env vars
// ---------------------------------------------------------------------------

const mockAuthAdmin = {
  updateUserById: vi.fn(),
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

function createChain(terminalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "update", "eq", "range", "order", "or"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // Attach a .then so await works on the chain directly
  chain.then = (
    resolve: (v: { data: unknown; error: unknown; count: number | null }) => void,
  ) => {
    resolve({ ...terminalResult, count: 0 });
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

  it("strips % characters from query to prevent ILIKE injection", async () => {
    const { searchUsers } = await import("@/services/admin-service");

    const chain = createChain({ data: [], error: null });
    const orSpy = chain.or as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await searchUsers(supabase as never, "foo%bar", 0, 10);

    expect(orSpy).toHaveBeenCalledOnce();
    const orArg = orSpy.mock.calls[0][0] as string;
    expect(orArg).not.toContain("%bar");
    // sanitized should be 'foobar' — no % at all in the injected part
    expect(orArg).toContain("foobar");
  });

  it("strips _ characters from query", async () => {
    const { searchUsers } = await import("@/services/admin-service");

    const chain = createChain({ data: [], error: null });
    const orSpy = chain.or as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await searchUsers(supabase as never, "foo_bar", 0, 10);

    const orArg = orSpy.mock.calls[0][0] as string;
    // _ removed → foobar
    expect(orArg).toContain("foobar");
    expect(orArg).not.toContain("foo_bar");
  });

  it("truncates query longer than 100 characters", async () => {
    const { searchUsers } = await import("@/services/admin-service");

    const longQuery = "a".repeat(200);
    const chain = createChain({ data: [], error: null });
    const orSpy = chain.or as ReturnType<typeof vi.fn>;
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    await searchUsers(supabase as never, longQuery, 0, 10);

    const orArg = orSpy.mock.calls[0][0] as string;
    // The sanitized param embedded in the ilike pattern should be <= 100 chars
    // Pattern is: full_name.ilike.%{sanitized}%,... so extract the sanitized part
    const match = orArg.match(/ilike\.%(.+?)%,/);
    const embedded = match?.[1] ?? "";
    expect(embedded.length).toBeLessThanOrEqual(100);
  });

  it("returns empty array on DB error", async () => {
    const { searchUsers } = await import("@/services/admin-service");

    const chain = createChain({ data: null, error: { message: "DB error" } });
    const supabase = { from: vi.fn().mockReturnValue(chain) };

    const result = await searchUsers(supabase as never, "test", 0, 10);
    expect(result).toEqual({ users: [], total: 0 });
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

  it("sets is_suspended=true in profiles table", async () => {
    const { suspendUser } = await import("@/services/admin-service");
    const { supabase, chain } = createSuspendSupabase();

    await suspendUser(supabase as never, "user-001");

    expect(chain.update).toHaveBeenCalledWith({ is_suspended: true });
  });

  it("calls auth.admin.updateUserById with ban_duration to block login", async () => {
    const { suspendUser } = await import("@/services/admin-service");
    const { supabase } = createSuspendSupabase();

    const result = await suspendUser(supabase as never, "user-001");

    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith("user-001", {
      ban_duration: "876600h",
    });
    expect(result.success).toBe(true);
  });

  it("rolls back is_suspended=false if auth ban fails", async () => {
    mockAuthAdmin.updateUserById.mockResolvedValue({
      error: { message: "Auth service unavailable" },
    });

    const { suspendUser } = await import("@/services/admin-service");

    // Track calls to supabase.from() and update().eq()
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
    // First call suspends, second call rolls back
    expect(updateCalls[0]).toEqual({ is_suspended: true });
    expect(updateCalls[1]).toEqual({ is_suspended: false });
  });

  it("returns success=false immediately if DB update fails (no auth call)", async () => {
    const { suspendUser } = await import("@/services/admin-service");

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
    const { activateUser } = await import("@/services/admin-service");

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

  it("rolls back is_suspended=true if auth unban fails", async () => {
    mockAuthAdmin.updateUserById.mockResolvedValue({
      error: { message: "Auth service unavailable" },
    });

    const { activateUser } = await import("@/services/admin-service");

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
    expect(updateCalls[0]).toEqual({ is_suspended: false });
    expect(updateCalls[1]).toEqual({ is_suspended: true });
  });
});
