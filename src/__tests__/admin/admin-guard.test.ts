/**
 * Tests for adminOnly() guard in src/lib/admin-guard.ts
 * Verifies authentication and authorization enforcement.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal chainable query mock that resolves to `result` via .single(). */
function createQueryChain(singleResult: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult),
  };
  return chain;
}

/** Build a mock Supabase client. */
function createMockClient(opts: {
  user?: { id: string } | null;
  authError?: { message: string } | null;
  profileRole?: string | null;
  profileError?: { message: string } | null;
}) {
  const {
    user = null,
    authError = null,
    profileRole = null,
    profileError = null,
  } = opts;

  const profileChain = createQueryChain({
    data: profileRole !== null ? { role: profileRole } : null,
    error: profileError,
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
    },
    from: vi.fn().mockReturnValue(profileChain),
  };
}

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("adminOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when there is no authenticated user", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockClient({ user: null });
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { adminOnly } = await import("@/lib/admin-guard");
    const result = await adminOnly(new Request("http://localhost/api/test"));

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when user's profile role is not admin", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockClient({
      user: { id: "user-123" },
      profileRole: "homebuyer",
    });
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { adminOnly } = await import("@/lib/admin-guard");
    const result = await adminOnly(new Request("http://localhost/api/test"));

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("returns 403 when user's profile role is null", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockClient({
      user: { id: "user-123" },
      profileRole: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { adminOnly } = await import("@/lib/admin-guard");
    const result = await adminOnly(new Request("http://localhost/api/test"));

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(403);
  });

  it("returns AdminContext with user and supabase when role is admin", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockClient({
      user: { id: "admin-456" },
      profileRole: "admin",
    });
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { adminOnly } = await import("@/lib/admin-guard");
    const result = await adminOnly(new Request("http://localhost/api/test"));

    // Should NOT be a Response — should be an AdminContext
    expect(result).not.toBeInstanceOf(Response);
    const ctx = result as { user: { id: string }; supabase: unknown };
    expect(ctx.user.id).toBe("admin-456");
    expect(ctx.supabase).toBeDefined();
  });

  it("returns 503 when the profiles DB query throws", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-789" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error("DB connection refused")),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { adminOnly } = await import("@/lib/admin-guard");
    const result = await adminOnly(new Request("http://localhost/api/test"));

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(503);
  });
});
