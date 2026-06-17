import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { InvoiceGenerator } from "@/components/dashboard/provider/InvoiceGenerator";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Mocks
// InvoiceGenerator uses sonner toasts, react-hook-form (real), plain number
// inputs (VAT rate is editable), and fetch for create / mark-paid / pdf.
// VAT rate here is a plain <input type=number> so it IS interactive in happy-dom.
// ---------------------------------------------------------------------------

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
    info: vi.fn(),
  },
}));

const baseProps = {
  providerId: "prov-1",
  providerName: "Acme Plumbing",
  quoteId: "quote-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Form totals summary is the first `dl` containing "Subtotal" (preview is second).
function getPreviewTotals(): HTMLElement {
  const subtotals = screen.getAllByText("Subtotal");
  return subtotals[subtotals.length - 1].closest("dl") as HTMLElement;
}

describe("InvoiceGenerator — render", () => {
  it("renders the client and line-item sections", () => {
    render(<InvoiceGenerator {...baseProps} />);
    expect(screen.getByLabelText("Client Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Item name")).toBeInTheDocument();
  });

  it("shows the Generate Invoice action before an invoice is saved", () => {
    render(<InvoiceGenerator {...baseProps} />);
    expect(screen.getByRole("button", { name: /Generate Invoice/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark as Paid/i })).not.toBeInTheDocument();
  });
});

describe("InvoiceGenerator — prefill from quote", () => {
  it("prefills client name and line items from the accepted quote", () => {
    const prefillLineItems: InvoiceLineItem[] = [
      {
        name: "Boiler unit",
        quantity: 1,
        unit_price_pence: 80_000,
        total_pence: 80_000,
        vat_rate: 0.2,
      },
    ];

    render(
      <InvoiceGenerator
        {...baseProps}
        prefillClientName="Jane Smith"
        prefillClientId="client-7"
        prefillLineItems={prefillLineItems}
        prefillNotes="As per quote Q-1001"
      />,
    );

    expect((screen.getByLabelText("Client Name") as HTMLInputElement).value).toBe("Jane Smith");
    expect((screen.getByPlaceholderText("Item name") as HTMLInputElement).value).toBe("Boiler unit");
  });
});

describe("InvoiceGenerator — line item add / remove", () => {
  it("adds and removes rows, disabling removal of the final row", () => {
    render(<InvoiceGenerator {...baseProps} />);

    expect(screen.getAllByPlaceholderText("Item name")).toHaveLength(1);
    expect(screen.getAllByLabelText("Remove line item")[0]).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Add Row/i }));
    expect(screen.getAllByPlaceholderText("Item name")).toHaveLength(2);

    fireEvent.click(screen.getAllByLabelText("Remove line item")[1]);
    expect(screen.getAllByPlaceholderText("Item name")).toHaveLength(1);
  });
});

describe("InvoiceGenerator — VAT calculation display", () => {
  it("computes VAT totals from qty, unit price and the editable VAT rate", async () => {
    render(<InvoiceGenerator {...baseProps} />);

    // qty 2 @ £100 = £200, default VAT 20% -> £40, total £240
    fireEvent.change(screen.getByPlaceholderText("Qty"), { target: { value: "2" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });

    await waitFor(() => {
      const totals = within(getPreviewTotals());
      expect(totals.getByText("£200.00")).toBeInTheDocument();
    });
    let totals = within(getPreviewTotals());
    expect(totals.getByText("£40.00")).toBeInTheDocument();
    expect(totals.getByText("£240.00")).toBeInTheDocument();

    // Change VAT rate to 0% -> VAT £0, total £200
    const vatInput = screen.getByPlaceholderText("20");
    fireEvent.change(vatInput, { target: { value: "0" } });

    await waitFor(() => {
      totals = within(getPreviewTotals());
      expect(totals.getByText("£0.00")).toBeInTheDocument();
    });
  });
});

describe("InvoiceGenerator — generate invoice submission", () => {
  it("POSTs to /api/provider/invoices and shows the saved banner + actions on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "inv-1", invoice_number: "INV-2026-001" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceGenerator {...baseProps} prefillClientId="client-7" />);

    fireEvent.click(screen.getByRole("button", { name: /Generate Invoice/i }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Invoice INV-2026-001 created."),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/provider/invoices",
      expect.objectContaining({ method: "POST" }),
    );
    // Saved banner + Mark as Paid / Download now visible
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark as Paid/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PDF/i })).toBeInTheDocument();
  });

  it("surfaces the server error message when invoice creation fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Client not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceGenerator {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Generate Invoice/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Client not found"));
    // Stays on the generate step
    expect(screen.getByRole("button", { name: /Generate Invoice/i })).toBeInTheDocument();
  });
});

describe("InvoiceGenerator — mark as paid", () => {
  it("PATCHes the paid endpoint and reflects the paid state", async () => {
    const fetchMock = vi
      .fn()
      // create
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "inv-1", invoice_number: "INV-2026-001" }),
      })
      // mark paid
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceGenerator {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Generate Invoice/i }));
    await screen.findByRole("button", { name: /Mark as Paid/i });

    fireEvent.click(screen.getByRole("button", { name: /Mark as Paid/i }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Invoice marked as paid."),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/provider/invoices/inv-1/paid",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(await screen.findByRole("button", { name: "Paid" })).toBeDisabled();
  });
});
