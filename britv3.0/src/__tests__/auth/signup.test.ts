import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

// Mock the browser client
const mockClient = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockClient),
}));

import { signUp, signIn, signOut, getUser } from "@/services/auth/auth-service";

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.origin for tests
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("calls supabase.auth.signUp with email, password, and display_name metadata", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    mockClient.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser, session: null },
      error: null,
    });

    const result = await signUp("test@example.com", "Password123!", "Test User");

    expect(mockClient.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password123!",
      options: {
        data: { display_name: "Test User" },
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
    expect(result.data?.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });

  it("returns error for weak password", async () => {
    const weakPasswordError = { message: "Password is too weak", code: "weak_password" };
    mockClient.auth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: weakPasswordError,
    });

    const result = await signUp("test@example.com", "123", "Test User");

    expect(result.error).toEqual(weakPasswordError);
    expect(result.data?.user).toBeNull();
  });

  it("returns error for duplicate email", async () => {
    const duplicateError = { message: "User already registered", code: "user_already_exists" };
    mockClient.auth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: duplicateError,
    });

    const result = await signUp("existing@example.com", "Password123!", "Test User");

    expect(result.error).toEqual(duplicateError);
  });
});

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.auth.signInWithPassword with email and password", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    const mockSession = { access_token: "token-123" };
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const result = await signIn("test@example.com", "Password123!");

    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password123!",
    });
    expect(result.data?.user).toEqual(mockUser);
    expect(result.data?.session).toEqual(mockSession);
    expect(result.error).toBeNull();
  });

  it("returns error for invalid credentials", async () => {
    const invalidError = { message: "Invalid login credentials", code: "invalid_credentials" };
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: invalidError,
    });

    const result = await signIn("test@example.com", "wrong");

    expect(result.error).toEqual(invalidError);
  });
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.auth.signOut", async () => {
    mockClient.auth.signOut.mockResolvedValueOnce({ error: null });

    const result = await signOut();

    expect(mockClient.auth.signOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });
});

describe("getUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.auth.getUser (not getSession)", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const result = await getUser();

    expect(mockClient.auth.getUser).toHaveBeenCalled();
    expect(mockClient.auth.getSession).not.toHaveBeenCalled();
    expect(result.data?.user).toEqual(mockUser);
  });
});
