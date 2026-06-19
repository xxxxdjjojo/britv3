// M3-A1 — RentCollectionClient: summary cards, tab switching, table render,
// empty state, and the error path when the mark-paid data source rejects.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  RentCollectionGroup,
  RentCollectionEntry,
  FinancialEntry,
} from "@/types/landlord";

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
// FinancialEntryForm pulls in client-only deps; stub it — not under test here.
vi.mock("@/components/landlord/FinancialEntryForm", () => ({
  FinancialEntryForm: () => <div data-testid="financial-entry-form" />,
}));

import { RentCollectionClient } from "@/app/(protected)/dashboard/landlord/rent/RentCollectionClient";

function buildEntry(overrides: Partial<FinancialEntry>): FinancialEntry {
  return {
    id: "fin-1",
    property_id: "prop-1",
    tenancy_id: "ten-1",
    user_id: "user-1",
    type: "income" as FinancialEntry["type"],
    category: "rent",
    amount: 1500,
    entry_date: "2026-06-01",
    description: null,
    receipt_url: null,
    rent_period_start: null,
    rent_period_end: null,
    payment_status: "overdue",
    created_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function wrapEntry(
  entry: FinancialEntry,
  tenant_name: string,
  property_address: string,
): RentCollectionEntry {
  return { entry, tenant_name, property_address };
}

const POPULATED: RentCollectionGroup = {
  paid: [wrapEntry(buildEntry({ id: "paid-1", payment_status: "paid", amount: 1500 }), "Paid Pat", "1 Paid St")],
  partial: [wrapEntry(buildEntry({ id: "part-1", payment_status: "partial", amount: 800 }), "Partial Pam", "2 Partial Rd")],
  overdue: [wrapEntry(buildEntry({ id: "od-1", payment_status: "overdue", amount: 1200 }), "Overdue Ola", "3 Overdue Ln")],
};

const EMPTY: RentCollectionGroup = { paid: [], partial: [], overdue: [] };

function renderClient(initialData: RentCollectionGroup) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RentCollectionClient initialData={initialData} />
    </QueryClientProvider>,
  );
}

describe("RentCollectionClient — summary + table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Keep the background refetch from hitting the network: resolve to initialData shape.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(EMPTY) }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("computes summary totals from the grouped data", () => {
    renderClient(POPULATED);
    // Each summary card pairs a label with its computed total. Scope to the card.
    const expectedCard = screen.getByText("Total Expected").closest("[data-slot='card']");
    const collectedCard = screen.getByText("Total Collected").closest("[data-slot='card']");
    const outstandingCard = screen.getByText("Outstanding").closest("[data-slot='card']");

    // Total expected = 1500 + 800 + 1200 = 3500
    expect(within(expectedCard as HTMLElement).getByText("£3,500")).toBeInTheDocument();
    // Total collected (paid only) = 1500
    expect(within(collectedCard as HTMLElement).getByText("£1,500")).toBeInTheDocument();
    // Outstanding (partial) = 800
    expect(within(outstandingCard as HTMLElement).getByText("£800")).toBeInTheDocument();
  });

  it("renders all rent rows in the All tab", () => {
    renderClient(POPULATED);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Paid Pat")).toBeInTheDocument();
    expect(within(table).getByText("Partial Pam")).toBeInTheDocument();
    expect(within(table).getByText("Overdue Ola")).toBeInTheDocument();
  });

  it("filters to overdue entries when the Overdue tab is active", () => {
    renderClient(POPULATED);
    fireEvent.click(screen.getByRole("button", { name: /Overdue/ }));
    const table = screen.getByRole("table");
    expect(within(table).getByText("Overdue Ola")).toBeInTheDocument();
    expect(within(table).queryByText("Paid Pat")).not.toBeInTheDocument();
  });

  it("filters to partial entries on the Partial / Upcoming tab", () => {
    renderClient(POPULATED);
    fireEvent.click(screen.getByRole("button", { name: /Partial \/ Upcoming/ }));
    const table = screen.getByRole("table");
    expect(within(table).getByText("Partial Pam")).toBeInTheDocument();
    expect(within(table).queryByText("Overdue Ola")).not.toBeInTheDocument();
  });
});

describe("RentCollectionClient — empty state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(EMPTY) }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the empty message and no table when there are no entries", () => {
    renderClient(EMPTY);
    expect(screen.getByText("No rent entries found.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("RentCollectionClient — error state on mark-paid rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces an error toast when the mark-paid request rejects", async () => {
    // Background refetch (GET) resolves; the PATCH mark-paid call rejects.
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("mark-paid")) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(POPULATED) });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderClient(POPULATED);

    // Overdue row exposes a Mark Paid button (rendered by RentPaymentRow).
    const markButtons = screen.getAllByRole("button", { name: /Mark Paid/ });
    fireEvent.click(markButtons[0]);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Failed to mark payment as paid");
    });
  });
});
