import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { QuoteBuilderForm } from "@/components/dashboard/provider/QuoteBuilderForm";

// ---------------------------------------------------------------------------
// Mocks
// QuoteBuilderForm uses sonner toasts, react-hook-form (real), Radix Select
// (for VAT rate — see FINDING below), localStorage (happy-dom provides it),
// and fetch for the suggest-items / create / send endpoints.
// ---------------------------------------------------------------------------

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
    info: (msg: string) => toastInfo(msg),
  },
}));

const baseProps = {
  providerId: "prov-1",
  providerName: "Acme Plumbing",
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// The live preview is the second `dl` (totals). The form summary is the first.
function getFormTotals(): HTMLElement {
  const subtotals = screen.getAllByText("Subtotal");
  // First Subtotal belongs to the form's totals summary.
  return subtotals[0].closest("dl") as HTMLElement;
}

describe("QuoteBuilderForm — render", () => {
  it("renders the provider name in the live preview", () => {
    render(<QuoteBuilderForm {...baseProps} />);
    // Provider name appears in the preview "From" block
    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
  });

  it("starts with a single empty line item row", () => {
    render(<QuoteBuilderForm {...baseProps} />);
    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(1);
  });

  it("renders Save Draft and Send to Client actions", () => {
    render(<QuoteBuilderForm {...baseProps} />);
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send to Client" })).toBeInTheDocument();
  });
});

describe("QuoteBuilderForm — RFQ prefill", () => {
  it("renders prefilled client name and category as read-only when requestId is present", () => {
    render(
      <QuoteBuilderForm
        {...baseProps}
        requestId="req-99"
        prefillClientName="Jane Smith"
        prefillJobTitle="Boiler swap"
        prefillCategory="Plumbing"
      />,
    );

    const clientInput = screen.getByLabelText("Client Name") as HTMLInputElement;
    expect(clientInput.value).toBe("Jane Smith");
    expect(clientInput).toHaveAttribute("readonly");

    const jobInput = screen.getByLabelText("Job Title") as HTMLInputElement;
    expect(jobInput.value).toBe("Boiler swap");
    expect(jobInput).toHaveAttribute("readonly");
  });

  it("renders editable inputs when no requestId is supplied", () => {
    render(<QuoteBuilderForm {...baseProps} />);
    const clientInput = screen.getByLabelText("Client Name");
    expect(clientInput).not.toHaveAttribute("readonly");
  });
});

describe("QuoteBuilderForm — line item add / remove", () => {
  it("adds a row when 'Add Row' is clicked", () => {
    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Add Row/i }));

    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(2);
  });

  it("removes a row, but disables removal of the last remaining row", () => {
    render(<QuoteBuilderForm {...baseProps} />);

    // Only one row -> its remove button is disabled
    const removeBtns = screen.getAllByLabelText("Remove line item");
    expect(removeBtns[0]).toBeDisabled();

    // Add a second row then remove it
    fireEvent.click(screen.getByRole("button", { name: /Add Row/i }));
    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(2);

    const remove = screen.getAllByLabelText("Remove line item");
    fireEvent.click(remove[1]);
    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(1);
  });

  it("adds a section header row with 'Add Section'", () => {
    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Add Section/i }));

    expect(screen.getByPlaceholderText("Section title…")).toBeInTheDocument();
  });
});

describe("QuoteBuilderForm — totals + VAT calculation", () => {
  it("computes subtotal/VAT/total in the form summary from qty and unit price (default 20% VAT)", async () => {
    render(<QuoteBuilderForm {...baseProps} />);

    const qtyInput = screen.getByPlaceholderText("Qty");
    const priceInput = screen.getByPlaceholderText("0.00");

    // qty 2 @ £100 = £200 subtotal; default vatRate is 20% -> VAT £40; total £240
    fireEvent.change(qtyInput, { target: { value: "2" } });
    fireEvent.change(priceInput, { target: { value: "100" } });

    await waitFor(() => {
      const totals = within(getFormTotals());
      expect(totals.getByText("£200.00")).toBeInTheDocument();
    });
    const totals = within(getFormTotals());
    expect(totals.getByText("£40.00")).toBeInTheDocument();
    expect(totals.getByText("£240.00")).toBeInTheDocument();
  });

  // FINDING: VAT rate per-row is a Radix <Select> (SelectTrigger/SelectContent)
  // which relies on pointer-capture / ResizeObserver APIs not implemented in
  // happy-dom. Changing the rate via the UI cannot be exercised deterministically
  // here; the 0%/5%/20% summation math is covered against QuotePreview instead.
  it.todo("changing a line's VAT rate via the Radix Select recomputes VAT");
});

describe("QuoteBuilderForm — staged payments validation", () => {
  it("reveals milestone fields when staged payments is enabled", () => {
    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/Enable staged payments/i));

    expect(screen.getByText("Payment Milestones")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Milestone/i })).toBeInTheDocument();
  });

  it("shows a 'remaining to allocate' warning when milestones do not sum to the total", async () => {
    render(<QuoteBuilderForm {...baseProps} />);

    // Set a £100 line (subtotal £100, VAT £20 -> total £120)
    fireEvent.change(screen.getByPlaceholderText("Qty"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });

    fireEvent.click(screen.getByLabelText(/Enable staged payments/i));
    fireEvent.click(screen.getByRole("button", { name: /Add Milestone/i }));

    // Milestone of £50 leaves £70 unallocated against £120 total
    // Both line-item price and milestone amount use placeholder "0.00";
    // the milestone amount input is the last one in the DOM.
    const priceInputs = screen.getAllByPlaceholderText("0.00");
    const amountInput = priceInputs[priceInputs.length - 1];
    fireEvent.change(amountInput, { target: { value: "50" } });

    await waitFor(() =>
      expect(screen.getByText(/remaining to allocate/i)).toBeInTheDocument(),
    );
  });

  it("blocks sending when milestones do not balance and surfaces an error toast", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("Qty"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });

    fireEvent.click(screen.getByLabelText(/Enable staged payments/i));
    fireEvent.click(screen.getByRole("button", { name: /Add Milestone/i }));
    // Both line-item price and milestone amount use placeholder "0.00";
    // the milestone amount input is the last one in the DOM.
    const priceInputs = screen.getAllByPlaceholderText("0.00");
    const amountInput = priceInputs[priceInputs.length - 1];
    fireEvent.change(amountInput, { target: { value: "50" } });

    fireEvent.click(screen.getByRole("button", { name: "Send to Client" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Milestone amounts must sum to the quote total before sending.",
      ),
    );
    expect(global.fetch as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });
});

describe("QuoteBuilderForm — save draft submission", () => {
  it("POSTs to /api/provider/quotes and toasts success on draft save", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "quote-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteBuilderForm {...baseProps} requestId="req-1" />);

    fireEvent.change(screen.getByPlaceholderText("Qty"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Quote saved as draft."));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/provider/quotes",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces the server error message when the create endpoint fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Quote limit reached" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Quote limit reached"));
  });
});

describe("QuoteBuilderForm — templates", () => {
  it("saves the current line items as a named template", async () => {
    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Save template/i }));
    const nameInput = screen.getByPlaceholderText("Template name…");
    fireEvent.change(nameInput, { target: { value: "Boiler service" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Template "Boiler service" saved.'),
    );
    // Persisted to localStorage
    const stored = window.localStorage.getItem("britestate-quote-templates");
    expect(stored).toContain("Boiler service");
  });

  it("rejects an empty template name", () => {
    render(<QuoteBuilderForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Save template/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(toastError).toHaveBeenCalledWith("Please enter a template name.");
  });
});
