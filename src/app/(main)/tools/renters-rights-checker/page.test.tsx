import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

import RentersRightsCheckerPage, { metadata } from "./page";

describe("/tools/renters-rights-checker metadata", () => {
  it("carries a checker title and description", () => {
    expect(metadata.title).toMatch(/Renters' Rights Checker/);
    expect(metadata.description).toMatch(/Renters' Rights Act 2025/);
  });
});

describe("/tools/renters-rights-checker page", () => {
  it("renders a single h1 via CalculatorPageHeader", () => {
    render(<RentersRightsCheckerPage />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Renters' Rights Checker");
  });

  it("shows the not-legal-advice banner near the top", () => {
    render(<RentersRightsCheckerPage />);
    expect(
      screen.getByText(/general information, not legal advice/i),
    ).toBeInTheDocument();
  });

  it("emits FAQPage JSON-LD with the real FAQs", () => {
    const { container } = render(<RentersRightsCheckerPage />);
    const blob = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    )
      .map((s) => s.innerHTML)
      .join("\n");
    expect(blob).toContain('"@type":"FAQPage"');
    expect(blob).toContain("Is Section 21 still in force?");
    expect(blob).toContain("Are rental bidding wars banned?");
  });

  it("renders the content version stamp with the tree's checked date", () => {
    render(<RentersRightsCheckerPage />);
    expect(
      screen.getByText(/checked against legislation in force on/i),
    ).toBeInTheDocument();
    expect(screen.getByText("1 July 2026")).toBeInTheDocument();
  });
});
