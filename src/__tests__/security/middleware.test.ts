/**
 * Middleware route protection tests.
 * Tests auth guard redirects: unauthenticated from protected routes,
 * authenticated from auth routes, and public route passthrough.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @supabase/ssr before importing middleware
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock crypto.randomUUID for deterministic nonce
vi.stubGlobal("crypto", {
  ...crypto,
  randomUUID: vi.fn(() => "test-uuid-1234-5678-9012"),
});

import { middleware, config } from "@/middleware";

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

const mockAuthUser = {
  id: "user-123",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
};

describe("Middleware - Unauthenticated users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
  });

  it("redirects unauthenticated user from /dashboard to /login", async () => {
    const response = await middleware(createRequest("/dashboard"));
    expect(response.status).toBe(307);
    const location = response.headers.get("Location");
    expect(location).toContain("/login");
  });

  it("redirects unauthenticated user from /dashboard/homebuyer to /login", async () => {
    const response = await middleware(createRequest("/dashboard/homebuyer"));
    expect(response.status).toBe(307);
    const location = response.headers.get("Location");
    expect(location).toContain("/login");
  });

  it("redirects unauthenticated user from /settings to /login", async () => {
    const response = await middleware(createRequest("/settings"));
    expect(response.status).toBe(307);
    const location = response.headers.get("Location");
    expect(location).toContain("/login");
  });

  it("allows unauthenticated user to access / (public)", async () => {
    const response = await middleware(createRequest("/"));
    // Should NOT redirect
    expect(response.status).not.toBe(307);
  });

  it("allows unauthenticated user to access /about (public)", async () => {
    const response = await middleware(createRequest("/about"));
    expect(response.status).not.toBe(307);
  });

  it("allows unauthenticated user to access /login (auth route)", async () => {
    const response = await middleware(createRequest("/login"));
    expect(response.status).not.toBe(307);
  });

  it("allows unauthenticated user to access /register (auth route)", async () => {
    const response = await middleware(createRequest("/register"));
    expect(response.status).not.toBe(307);
  });
});

describe("Middleware - Authenticated users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
  });

  it("redirects authenticated user from /login to /dashboard", async () => {
    const response = await middleware(createRequest("/login"));
    expect(response.status).toBe(307);
    const location = response.headers.get("Location");
    expect(location).toContain("/dashboard");
  });

  it("redirects authenticated user from /register to /dashboard", async () => {
    const response = await middleware(createRequest("/register"));
    expect(response.status).toBe(307);
    const location = response.headers.get("Location");
    expect(location).toContain("/dashboard");
  });

  it("allows authenticated user to access /dashboard", async () => {
    const response = await middleware(createRequest("/dashboard"));
    expect(response.status).not.toBe(307);
  });

  it("allows authenticated user to access / (public)", async () => {
    const response = await middleware(createRequest("/"));
    expect(response.status).not.toBe(307);
  });
});

describe("Middleware - Matcher config", () => {
  it("exports a config with matcher array", () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });

  it("matcher excludes static files and images", () => {
    const matchers = config.matcher;
    // The matcher should have a pattern that excludes _next/static, _next/image, favicon.ico
    const matcherStr = JSON.stringify(matchers);
    expect(matcherStr).toContain("_next");
  });
});
