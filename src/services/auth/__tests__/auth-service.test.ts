import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Hoisted mocks for the Supabase browser client so the dynamic import inside
 * each test resolves to the same instances we set up here. The auth-service
 * module reads from `@/lib/supabase/client` at call time, so we mock that
 * module path.
 */
const { authMock, createClientMock } = vi.hoisted(() => {
  const authMock = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
  };
  return {
    authMock,
    createClientMock: vi.fn(() => ({ auth: authMock })),
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

// The auth-service references `window.location.origin` in some flows. Provide
// a stable origin in the happy-dom test environment.
beforeEach(() => {
  vi.resetModules();
  authMock.signUp.mockReset();
  authMock.signInWithPassword.mockReset();
  authMock.signInWithOAuth.mockReset();
  authMock.signOut.mockReset();
  authMock.resetPasswordForEmail.mockReset();
  authMock.updateUser.mockReset();
  authMock.getUser.mockReset();
  createClientMock.mockClear();
  createClientMock.mockReturnValue({ auth: authMock });
});

describe("signIn", () => {
  it("delegates to supabase.auth.signInWithPassword with email and password", async () => {
    // Arrange
    const session = {
      data: { user: { id: "user-1", email: "user@example.com" }, session: { access_token: "t" } },
      error: null,
    };
    authMock.signInWithPassword.mockResolvedValueOnce(session);

    // Act
    const { signIn } = await import("../auth-service");
    const result = await signIn("user@example.com", "secret123");

    // Assert
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result).toEqual(session);
  });

  it("returns the supabase error envelope when credentials are invalid", async () => {
    // Arrange — unauthenticated path: stale/wrong credentials
    const supabaseResult = {
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", status: 400 },
    };
    authMock.signInWithPassword.mockResolvedValueOnce(supabaseResult);

    // Act
    const { signIn } = await import("../auth-service");
    const result = await signIn("user@example.com", "wrong");

    // Assert
    expect(result).toEqual(supabaseResult);
    expect(result.data.user).toBeNull();
    expect(result.error?.message).toContain("Invalid login credentials");
  });
});

describe("getUser", () => {
  it("returns the authenticated user when a session exists (happy path)", async () => {
    // Arrange
    const supabaseResult = {
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    };
    authMock.getUser.mockResolvedValueOnce(supabaseResult);

    // Act
    const { getUser } = await import("../auth-service");
    const result = await getUser();

    // Assert
    expect(authMock.getUser).toHaveBeenCalledTimes(1);
    expect(result.data.user?.id).toBe("user-1");
    expect(result.error).toBeNull();
  });

  it("returns null user when session is missing or expired", async () => {
    // Arrange — stale/expired token: Supabase returns null user with an AuthError
    const supabaseResult = {
      data: { user: null },
      error: { message: "Auth session missing!", status: 401, name: "AuthSessionMissingError" },
    };
    authMock.getUser.mockResolvedValueOnce(supabaseResult);

    // Act
    const { getUser } = await import("../auth-service");
    const result = await getUser();

    // Assert
    expect(result.data.user).toBeNull();
    expect(result.error?.message).toBe("Auth session missing!");
  });
});

describe("signUp", () => {
  it("forwards display_name, role_intent, and confirmation emailRedirectTo to supabase", async () => {
    // Arrange
    authMock.signUp.mockResolvedValueOnce({
      data: { user: { id: "user-new" }, session: null },
      error: null,
    });

    // Act
    const { signUp } = await import("../auth-service");
    await signUp("new@example.com", "secretpw", "Ada Lovelace", "agent");

    // Assert
    expect(authMock.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        password: "secretpw",
        options: expect.objectContaining({
          data: { display_name: "Ada Lovelace", role_intent: "agent" },
          emailRedirectTo: expect.stringContaining(
            "/auth/callback?next=%2Fverify-email%2Fconfirmed",
          ),
        }),
      }),
    );
  });
});

describe("signOut", () => {
  it("calls supabase.auth.signOut() and returns its result", async () => {
    // Arrange
    authMock.signOut.mockResolvedValueOnce({ error: null });

    // Act
    const { signOut } = await import("../auth-service");
    const result = await signOut();

    // Assert
    expect(authMock.signOut).toHaveBeenCalledTimes(1);
    expect(result.error).toBeNull();
  });
});

describe("signInWithOAuth", () => {
  it("passes google-specific queryParams (offline access + consent prompt)", async () => {
    // Arrange
    authMock.signInWithOAuth.mockResolvedValueOnce({ data: { provider: "google", url: "https://oauth" }, error: null });

    // Act
    const { signInWithOAuth } = await import("../auth-service");
    await signInWithOAuth("google");

    // Assert
    expect(authMock.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback"),
        queryParams: { access_type: "offline", prompt: "consent" },
      }),
    });
  });

  it("does NOT include google queryParams for Apple OAuth", async () => {
    // Arrange
    authMock.signInWithOAuth.mockResolvedValueOnce({ data: { provider: "apple", url: "https://oauth" }, error: null });

    // Act
    const { signInWithOAuth } = await import("../auth-service");
    await signInWithOAuth("apple");

    // Assert
    const call = authMock.signInWithOAuth.mock.calls[0][0];
    expect(call.provider).toBe("apple");
    expect(call.options.queryParams).toBeUndefined();
  });
});

describe("resetPassword and updatePassword", () => {
  it("resetPassword forwards the redirectTo URL", async () => {
    // Arrange
    authMock.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null });

    // Act
    const { resetPassword } = await import("../auth-service");
    await resetPassword("user@example.com");

    // Assert
    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/reset-password"),
      }),
    );
  });

  it("updatePassword calls supabase.auth.updateUser({ password })", async () => {
    // Arrange
    authMock.updateUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });

    // Act
    const { updatePassword } = await import("../auth-service");
    await updatePassword("new-secret");

    // Assert
    expect(authMock.updateUser).toHaveBeenCalledWith({ password: "new-secret" });
  });
});
