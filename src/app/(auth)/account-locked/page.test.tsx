/**
 * Smoke-render test: account-locked page.
 * Asserts heading and primary action are present.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import AccountLockedPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AccountLockedPage", () => {
  it("renders the heading", async () => {
    await act(async () => {
      render(<AccountLockedPage />);
    });
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Your account is temporarily locked");
  });

  it("renders the primary CTA", async () => {
    await act(async () => {
      render(<AccountLockedPage />);
    });
    const link = screen.getByRole("link", { name: /Reset Password Instead/i });
    expect(link).toBeDefined();
    expect((link as HTMLAnchorElement).href).toContain("/forgot-password");
  });
});
