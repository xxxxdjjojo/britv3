import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TenancyPage from "./page";

// Mock next/link to a plain anchor so the Button `render={<Link/>}` wiring
// resolves to a real <a> with role="link" in the test DOM (no router needed).
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("TenancyPage — actions are wired to real destinations", () => {
  it("renders 'Message Landlord' as a link to the inbox", () => {
    render(<TenancyPage />);
    const link = screen.getByRole("link", { name: /message landlord/i });
    expect(link).toHaveAttribute("href", "/inbox");
  });

  it("renders 'Report Maintenance' as a link to the post-a-job flow", () => {
    render(<TenancyPage />);
    const link = screen.getByRole("link", { name: /report maintenance/i });
    expect(link).toHaveAttribute("href", "/post-a-job");
  });

  it("renders 'View Lease Agreement' as a link to the documents vault", () => {
    render(<TenancyPage />);
    const link = screen.getByRole("link", { name: /view lease agreement/i });
    expect(link).toHaveAttribute("href", "/dashboard/renter/documents");
  });

  it("renders 'Payment History' as a link to the billing invoices page", () => {
    render(<TenancyPage />);
    const link = screen.getByRole("link", { name: /payment history/i });
    expect(link).toHaveAttribute("href", "/dashboard/renter/billing/invoices");
  });

  it("leaves no dead (no-op) action buttons in the sidebar cards", () => {
    render(<TenancyPage />);
    // Every actionable label on this page must navigate somewhere — none may
    // render as an inert <button> with no handler/href.
    for (const name of [
      /message landlord/i,
      /report maintenance/i,
      /view lease agreement/i,
      /payment history/i,
    ]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });
});
