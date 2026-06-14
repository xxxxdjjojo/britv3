import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuotePreview } from "./QuotePreview";

const baseProps = {
  providerName: "Smith Plumbing Ltd",
  clientName: "Jane Doe",
  jobTitle: "Boiler replacement",
  lineItems: [
    { description: "Labour", qty: 2, unitPrice: 150, vatRate: 20 as const },
    { description: "Parts", qty: 1, unitPrice: 300, vatRate: 5 as const },
  ],
  notes: "12-month workmanship guarantee.",
  validUntil: "2026-07-01",
};

describe("QuotePreview", () => {
  it("renders provider and client names", () => {
    render(<QuotePreview {...baseProps} />);
    expect(screen.getByText("Smith Plumbing Ltd")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the job title", () => {
    render(<QuotePreview {...baseProps} />);
    expect(screen.getByText("Boiler replacement")).toBeInTheDocument();
  });

  it("renders line item descriptions", () => {
    render(<QuotePreview {...baseProps} />);
    expect(screen.getByText("Labour")).toBeInTheDocument();
    expect(screen.getByText("Parts")).toBeInTheDocument();
  });

  it("renders notes", () => {
    render(<QuotePreview {...baseProps} />);
    expect(
      screen.getByText("12-month workmanship guarantee."),
    ).toBeInTheDocument();
  });

  it("shows empty state when no line items", () => {
    render(<QuotePreview {...baseProps} lineItems={[]} />);
    expect(screen.getByText("No line items yet")).toBeInTheDocument();
  });

  it("renders section header rows in the preview table", () => {
    render(
      <QuotePreview
        {...baseProps}
        lineItems={[
          {
            description: "",
            qty: 1,
            unitPrice: 0,
            vatRate: 0 as const,
            isSectionHeader: true,
            sectionTitle: "Phase 1",
          },
          { description: "Labour", qty: 1, unitPrice: 100, vatRate: 20 as const },
        ]}
      />,
    );
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Labour")).toBeInTheDocument();
  });

  it("renders optional quoteRef when provided", () => {
    render(<QuotePreview {...baseProps} quoteRef="Q-2026-001" />);
    expect(screen.getByText(/Q-2026-001/)).toBeInTheDocument();
  });

  it("omits notes section when notes is empty", () => {
    render(<QuotePreview {...baseProps} notes="" />);
    expect(screen.queryByText("12-month workmanship guarantee.")).not.toBeInTheDocument();
  });
});
