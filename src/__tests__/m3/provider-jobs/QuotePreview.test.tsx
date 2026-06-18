import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QuotePreview } from "@/components/dashboard/provider/QuotePreview";
import type { LineItemRow } from "@/components/dashboard/provider/QuoteBuilderForm";

// ---------------------------------------------------------------------------
// QuotePreview — presentational quote document with live VAT totals.
// Pure render-with-fixture-props component; no network, no client deps.
// ---------------------------------------------------------------------------

function lineItem(overrides: Partial<LineItemRow> = {}): LineItemRow {
  return {
    description: "Labour",
    qty: 1,
    unitPrice: 100,
    vatRate: 20,
    ...overrides,
  };
}

describe("QuotePreview — render with data", () => {
  it("renders provider, client and job title", () => {
    render(
      <QuotePreview
        providerName="Acme Plumbing"
        clientName="Jane Smith"
        jobTitle="Boiler replacement"
        lineItems={[lineItem()]}
        notes=""
        validUntil=""
      />,
    );

    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Boiler replacement")).toBeInTheDocument();
  });

  it("falls back to placeholder names when provider/client blank", () => {
    render(
      <QuotePreview
        providerName=""
        clientName=""
        jobTitle=""
        lineItems={[lineItem()]}
        notes=""
        validUntil=""
      />,
    );

    expect(screen.getByText("Your Name")).toBeInTheDocument();
    expect(screen.getByText("Client Name")).toBeInTheDocument();
  });

  it("renders the quote ref when provided", () => {
    render(
      <QuotePreview
        providerName="Acme"
        clientName="Jane"
        jobTitle="Job"
        lineItems={[lineItem()]}
        notes=""
        validUntil=""
        quoteRef="Q-1001"
      />,
    );

    expect(screen.getByText(/Q-1001/)).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(
      <QuotePreview
        providerName="Acme"
        clientName="Jane"
        jobTitle="Job"
        lineItems={[lineItem()]}
        notes="Deposit required up front."
        validUntil=""
      />,
    );

    expect(screen.getByText("Deposit required up front.")).toBeInTheDocument();
  });
});

describe("QuotePreview — empty state", () => {
  it("shows the empty line-items placeholder when there are no items", () => {
    render(
      <QuotePreview
        providerName="Acme"
        clientName="Jane"
        jobTitle=""
        lineItems={[]}
        notes=""
        validUntil=""
      />,
    );

    expect(screen.getByText("No line items yet")).toBeInTheDocument();
  });
});

describe("QuotePreview — VAT calculation display", () => {
  it("computes subtotal, VAT and total for a single 20% line", () => {
    // qty 2 @ £100 = £200 subtotal, 20% VAT = £40, total £240
    render(
      <QuotePreview
        providerName="Acme"
        clientName="Jane"
        jobTitle=""
        lineItems={[lineItem({ qty: 2, unitPrice: 100, vatRate: 20 })]}
        notes=""
        validUntil=""
      />,
    );

    const totals = screen.getByText("Subtotal").closest("dl") as HTMLElement;
    const dl = within(totals);
    expect(dl.getByText("£200.00")).toBeInTheDocument();
    expect(dl.getByText("£40.00")).toBeInTheDocument();
    expect(dl.getByText("£240.00")).toBeInTheDocument();
  });

  it("sums mixed VAT rates (0%, 5%, 20%) across multiple lines", () => {
    // £100 @ 0% (VAT 0), £100 @ 5% (VAT 5), £100 @ 20% (VAT 20)
    // subtotal £300, VAT £25, total £325
    render(
      <QuotePreview
        providerName="Acme"
        clientName="Jane"
        jobTitle=""
        lineItems={[
          lineItem({ qty: 1, unitPrice: 100, vatRate: 0 }),
          lineItem({ qty: 1, unitPrice: 100, vatRate: 5 }),
          lineItem({ qty: 1, unitPrice: 100, vatRate: 20 }),
        ]}
        notes=""
        validUntil=""
      />,
    );

    const totals = screen.getByText("Subtotal").closest("dl") as HTMLElement;
    const dl = within(totals);
    expect(dl.getByText("£300.00")).toBeInTheDocument();
    expect(dl.getByText("£25.00")).toBeInTheDocument();
    expect(dl.getByText("£325.00")).toBeInTheDocument();
  });

  it("excludes section header rows from totals", () => {
    render(
      <QuotePreview
        providerName="Acme"
        clientName="Jane"
        jobTitle=""
        lineItems={[
          { description: "", qty: 0, unitPrice: 0, vatRate: 0, isSectionHeader: true, sectionTitle: "Phase 1" },
          lineItem({ qty: 1, unitPrice: 100, vatRate: 20 }),
        ]}
        notes=""
        validUntil=""
      />,
    );

    // Section header text appears as a row
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    // Totals reflect only the real line: subtotal £100, VAT £20, total £120
    const totals = screen.getByText("Subtotal").closest("dl") as HTMLElement;
    const dl = within(totals);
    expect(dl.getByText("£100.00")).toBeInTheDocument();
    expect(dl.getByText("£20.00")).toBeInTheDocument();
    expect(dl.getByText("£120.00")).toBeInTheDocument();
  });
});
