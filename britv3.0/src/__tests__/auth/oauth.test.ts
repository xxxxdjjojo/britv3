import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

const mockClient = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockClient),
}));

import { signInWithOAuth } from "@/services/auth/auth-service";

describe("signInWithOAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("calls supabase.auth.signInWithOAuth with Google provider and PKCE options", async () => {
    mockClient.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: "google", url: "https://accounts.google.com/..." },
      error: null,
    });

    const result = await signInWithOAuth("google");

    expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    expect(result.error).toBeNull();
  });

  it("calls supabase.auth.signInWithOAuth with Apple provider without Google-specific params", async () => {
    mockClient.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: "apple", url: "https://appleid.apple.com/..." },
      error: null,
    });

    const result = await signInWithOAuth("apple");

    expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "apple",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
    expect(result.error).toBeNull();
  });

  it("returns error when OAuth fails", async () => {
    const oauthError = { message: "OAuth provider error", code: "oauth_error" };
    mockClient.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: null, url: null },
      error: oauthError,
    });

    const result = await signInWithOAuth("google");

    expect(result.error).toEqual(oauthError);
  });
});
