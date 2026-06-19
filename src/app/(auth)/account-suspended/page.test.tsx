/**
 * Smoke-render test: account-suspended page.
 * Asserts heading and primary action are present.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AccountSuspendedPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AccountSuspendedPage", () => {
  it("renders the heading", async () => {
    render(<AccountSuspendedPage />);
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Your account has been suspended");
  });

  it("renders the Contact Support CTA", async () => {
    render(<AccountSuspendedPage />);
    const link = await screen.findByRole("link", { name: /Contact Support/i });
    expect(link).toBeDefined();
    expect((link as HTMLAnchorElement).href).toContain("mailto:support@truedeed.co.uk");
  });
});
