/**
 * Smoke-render test: account-deletion-confirm page.
 * Asserts heading and primary action are present.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AccountDeletionConfirmPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: () => ({ update: () => ({ eq: vi.fn() }) }),
  }),
}));

describe("AccountDeletionConfirmPage", () => {
  it("renders the heading", () => {
    render(<AccountDeletionConfirmPage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Your account deletion is scheduled");
  });

  it("renders the primary cancel button", () => {
    render(<AccountDeletionConfirmPage />);
    const btn = screen.getByRole("button", { name: /Cancel Deletion/i });
    expect(btn).toBeDefined();
  });
});
