import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

// Mock the server client for the callback route
const mockServerClient = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockServerClient),
}));

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { GET } from "@/app/auth/callback/route";
import { NextRequest } from "next/server";

describe("Auth callback route (PKCE code exchange)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges code for session and redirects to /dashboard", async () => {
    mockServerClient.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: "user-1" }, session: { access_token: "token" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=test-code-123");

    const response = await GET(request);

    expect(mockServerClient.auth.exchangeCodeForSession).toHaveBeenCalledWith("test-code-123");
    // Should redirect to dashboard
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("redirects to /login with error when code exchange fails", async () => {
    mockServerClient.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid code", code: "invalid_code" },
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=invalid-code");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("error=auth_callback_error");
  });

  it("redirects to /login with error when no code provided", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("error=auth_callback_error");
  });

  it("redirects to custom next URL when provided", async () => {
    mockServerClient.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: "user-1" }, session: { access_token: "token" } },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code&next=/settings",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/settings");
  });
});
