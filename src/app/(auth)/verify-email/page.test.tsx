import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VerifyEmailPage from "./page";

const { authMock } = vi.hoisted(() => ({
  authMock: {
    getUser: vi.fn(),
    resend: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: authMock }),
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
    authMock.getUser.mockResolvedValue({ data: { user: null } });
    authMock.resend.mockResolvedValue({ data: {}, error: null });
  });

  it("resends signup confirmation using the pending signup email without a session", async () => {
    window.localStorage.setItem("truedeed_pending_signup_email", "new@example.com");

    render(<VerifyEmailPage />);

    expect(await screen.findByText("new@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^resend email$/i }));

    await waitFor(() => {
      expect(authMock.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "new@example.com",
        options: {
          emailRedirectTo:
            "http://localhost:3000/auth/callback?next=%2Fverify-email%2Fconfirmed",
        },
      });
    });
  });
});
