import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

const mockClient = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockClient),
}));

import { resetPassword, updatePassword } from "@/services/auth/auth-service";

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("calls supabase.auth.resetPasswordForEmail with redirect URL", async () => {
    mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const result = await resetPassword("test@example.com");

    expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      {
        redirectTo: "http://localhost:3000/reset-password",
      },
    );
    expect(result.error).toBeNull();
  });

  it("returns error for invalid email", async () => {
    const emailError = { message: "Unable to validate email address", code: "validation_failed" };
    mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: emailError,
    });

    const result = await resetPassword("invalid");

    expect(result.error).toEqual(emailError);
  });
});

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.auth.updateUser with new password", async () => {
    mockClient.auth.updateUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const result = await updatePassword("NewPassword123!");

    expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
      password: "NewPassword123!",
    });
    expect(result.error).toBeNull();
  });

  it("returns error for weak new password", async () => {
    const weakError = { message: "Password is too weak", code: "weak_password" };
    mockClient.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: weakError,
    });

    const result = await updatePassword("123");

    expect(result.error).toEqual(weakError);
  });
});
