/**
 * CSP (Content Security Policy) and security headers tests.
 * Tests that the middleware sets correct CSP Level 3 headers with nonce
 * and all required security headers.
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

import { proxy } from "@/proxy";

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

describe("CSP Headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: unauthenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
  });

  it("sets Content-Security-Policy header on responses", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
  });

  it("includes nonce in script-src directive", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toMatch(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'[^;]*/);
  });

  it("includes self in default-src", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
  });

  it("allows Google and Apple OAuth domains in script-src", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain("https://accounts.google.com");
    expect(csp).toContain("https://appleid.cdn-apple.com");
  });

  it("allows Supabase domains in connect-src", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.supabase\.co/);
    expect(csp).toMatch(/connect-src[^;]*wss:\/\/\*\.supabase\.co/);
  });

  it("allows Sentry ingest (incl. non-US regions) in connect-src", async () => {
    const response = await middleware(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    // *.sentry.io covers any region host, e.g. oXXX.ingest.de.sentry.io, which
    // a bare *.ingest.sentry.io would NOT match (the wildcard stops at one label).
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.sentry\.io/);
  });

  it("allows Google and Apple OAuth in frame-src", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toMatch(/frame-src[^;]*https:\/\/accounts\.google\.com/);
    expect(csp).toMatch(/frame-src[^;]*https:\/\/appleid\.apple\.com/);
  });

  it("includes unsafe-inline in style-src for Tailwind", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
  });

  it("sets frame-ancestors to none", async () => {
    const response = await proxy(createRequest("/"));
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sets x-nonce response header for server components", async () => {
    const response = await proxy(createRequest("/"));
    const nonce = response.headers.get("x-nonce");
    expect(nonce).toBeTruthy();
    expect(typeof nonce).toBe("string");
  });
});

describe("Security Headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
  });

  it("sets X-Frame-Options to DENY", async () => {
    const response = await proxy(createRequest("/"));
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("sets X-Content-Type-Options to nosniff", async () => {
    const response = await proxy(createRequest("/"));
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets Referrer-Policy to strict-origin-when-cross-origin", async () => {
    const response = await proxy(createRequest("/"));
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sets Permissions-Policy restricting camera, microphone, geolocation", async () => {
    const response = await proxy(createRequest("/"));
    const pp = response.headers.get("Permissions-Policy");
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
  });
});
