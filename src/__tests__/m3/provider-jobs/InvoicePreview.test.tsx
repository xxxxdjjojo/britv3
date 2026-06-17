import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { InvoicePreview } from "@/components/dashboard/provider/InvoicePreview";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// InvoicePreview — presentational invoice document with VAT totals.
// Pure render-with-fixture-props component.
// vat_rate here is a FRACTION (0.2 = 20%), unlike QuoteBuilder's integer rate.
// ---------------------------------------------------------------------------

function item(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    name: "Call-out fee",
    quantity: 1,
    unit_price_pence: 10_000,
    total_pence: 10_000,
    vat_rate: 0.2,
    ...overrides,
  };
}

describe("InvoicePreview — render with data", () => {
  it("renders provider, email and client name", () => {
    render(
      <InvoicePreview
        providerName="Acme Plumbing"
        providerEmail="hello@acme.test"
        clientName="Jane Smith"
        lineItems={[item()]}
      />,
    );

    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
    expect(screen.getByText("hello@acme.test")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders the invoice number, payment terms and notes when provided", () => {
    render(
      <InvoicePreview
        invoiceNumber="INV-2026-001"
        providerName="Acme"
        clientName="Jane"
        lineItems={[item()]}
        paymentTerms="14 days, bank transfer"
        notes="Thanks for your business."
      />,
    );

    expect(screen.getByText("INV-2026-001")).toBeInTheDocument();
    expect(screen.getByText("14 days, bank transfer")).toBeInTheDocument();
    expect(screen.getByText("Thanks for your business.")).toBeInTheDocument();
  });

  it("falls back to placeholder names when blank", () => {
    render(
      <InvoicePreview providerName="" clientName="" lineItems={[item()]} />,
    );

    expect(screen.getByText("Your Business")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
  });
});

describe("InvoicePreview — empty state", () => {
  it("shows the empty line-items placeholder", () => {
    render(
      <InvoicePreview providerName="Acme" clientName="Jane" lineItems={[]} />,
    );

    expect(screen.getByText("No line items yet")).toBeInTheDocument();
  });
});

describe("InvoicePreview — VAT calculation display", () => {
  it("computes subtotal, VAT and total for a single 20% line", () => {
    // total_pence £200, vat_rate 0.2 -> VAT £40, total £240
    render(
      <InvoicePreview
        providerName="Acme"
        clientName="Jane"
        lineItems={[item({ total_pence: 20_000, vat_rate: 0.2 })]}
      />,
    );

    const totals = screen.getByText("Subtotal").closest("dl") as HTMLElement;
    const dl = within(totals);
    expect(dl.getByText("£200.00")).toBeInTheDocument();
    expect(dl.getByText("£40.00")).toBeInTheDocument();
    expect(dl.getByText("£240.00")).toBeInTheDocument();
  });

  it("defaults missing vat_rate to 20% when undefined", () => {
    // vat_rate omitted -> component defaults to 0.2
    render(
      <InvoicePreview
        providerName="Acme"
        clientName="Jane"
        lineItems={[
          { name: "Parts", quantity: 1, unit_price_pence: 10_000, total_pence: 10_000 },
        ]}
      />,
    );

    const totals = screen.getByText("Subtotal").closest("dl") as HTMLElement;
    const dl = within(totals);
    expect(dl.getByText("£100.00")).toBeInTheDocument(); // subtotal
    expect(dl.getByText("£20.00")).toBeInTheDocument(); // VAT @ default 20%
    expect(dl.getByText("£120.00")).toBeInTheDocument(); // total
  });

  it("sums mixed VAT rates across multiple lines", () => {
    // £100 @ 0%, £100 @ 5% (VAT £5), £100 @ 20% (VAT £20)
    // subtotal £300, VAT £25, total £325
    render(
      <InvoicePreview
        providerName="Acme"
        clientName="Jane"
        lineItems={[
          item({ total_pence: 10_000, vat_rate: 0 }),
          item({ total_pence: 10_000, vat_rate: 0.05 }),
          item({ total_pence: 10_000, vat_rate: 0.2 }),
        ]}
      />,
    );

    const totals = screen.getByText("Subtotal").closest("dl") as HTMLElement;
    const dl = within(totals);
    expect(dl.getByText("£300.00")).toBeInTheDocument();
    expect(dl.getByText("£25.00")).toBeInTheDocument();
    expect(dl.getByText("£325.00")).toBeInTheDocument();
  });

  it("renders the VAT % per line in the table (rate * 100)", () => {
    render(
      <InvoicePreview
        providerName="Acme"
        clientName="Jane"
        lineItems={[item({ vat_rate: 0.05 })]}
      />,
    );

    expect(screen.getByText("5%")).toBeInTheDocument();
  });
});
