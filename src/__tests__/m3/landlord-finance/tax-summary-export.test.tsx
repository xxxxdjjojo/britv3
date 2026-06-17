import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaxSummaryExport } from "@/components/landlord/TaxSummaryExport";
import type { TaxSummary } from "@/types/landlord";

// @react-pdf/renderer cannot run in happy-dom. Stub the pieces the component
// uses so the CSV path (the deterministic part) is testable. PDFDownloadLink is
// rendered with a non-loading state so the button label is asserted.
vi.mock("@react-pdf/renderer", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    Document: Passthrough,
    Page: Passthrough,
    Text: Passthrough,
    View: Passthrough,
    StyleSheet: { create: (styles: unknown) => styles },
    PDFDownloadLink: ({
      children,
      fileName,
    }: {
      children: (state: { loading: boolean }) => React.ReactNode;
      fileName: string;
    }) => <div data-filename={fileName}>{children({ loading: false })}</div>,
  };
});

const SUMMARY: TaxSummary = {
  income: 18000,
  expenses: 4200,
  net: 13800,
  tax_year: "2025/26",
};

function renderExport(summary: TaxSummary = SUMMARY) {
  render(
    <TaxSummaryExport summary={summary} taxYear={summary.tax_year} landlordName="Jane Landlord" />,
  );
}

describe("TaxSummaryExport", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("renders both CSV and PDF download buttons", () => {
    renderExport();
    expect(screen.getByRole("button", { name: /Download CSV/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PDF/i })).toBeInTheDocument();
  });

  it("names the PDF download with the tax year (slash replaced by dash)", () => {
    renderExport();
    const link = document.querySelector("[data-filename]");
    expect(link).toHaveAttribute("data-filename", "tax-summary-2025-26.pdf");
  });

  it("generates a CSV blob on download click", () => {
    const clickSpy = vi.fn();
    const realCreate = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = realCreate(tag);
        if (tag === "a") {
          Object.defineProperty(el, "click", { value: clickSpy });
        }
        return el;
      });

    renderExport();
    fireEvent.click(screen.getByRole("button", { name: /Download CSV/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = (URL.createObjectURL as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toContain("text/csv");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    createSpy.mockRestore();
  });
});
