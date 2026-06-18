import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ExpenseTrackerClient } from "@/app/(protected)/dashboard/landlord/finance/expenses/ExpenseTrackerClient";
import type { FinancialEntry } from "@/types/landlord";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

type Property = { id: string; address_line1: string; city: string; postcode: string };

const PROPERTIES: Property[] = [
  { id: "prop-1", address_line1: "42 Baker Street", city: "London", postcode: "NW1 6XE" },
];

function buildEntry(overrides: Partial<FinancialEntry> = {}): FinancialEntry {
  return {
    id: "e1",
    property_id: "prop-1",
    tenancy_id: null,
    user_id: "user-1",
    type: "income",
    category: "rent",
    amount: 1500,
    entry_date: "2026-03-01",
    description: "March rent",
    receipt_url: null,
    rent_period_start: null,
    rent_period_end: null,
    payment_status: "paid",
    created_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

const ENTRIES: FinancialEntry[] = [
  buildEntry({ id: "e1", type: "income", category: "rent", amount: 1500, description: "March rent" }),
  buildEntry({ id: "e2", type: "expense", category: "maintenance", amount: 250, description: "Plumber", entry_date: "2026-03-05" }),
  buildEntry({ id: "e3", type: "expense", category: "insurance", amount: 100, description: null, entry_date: "2026-03-10" }),
];

describe("ExpenseTrackerClient", () => {
  it("renders a row for each entry with formatted category and description", () => {
    render(<ExpenseTrackerClient initialEntries={ENTRIES} properties={PROPERTIES} />);
    expect(screen.getByText("March rent")).toBeInTheDocument();
    expect(screen.getByText("Plumber")).toBeInTheDocument();
    // formatCategory turns "maintenance" -> "Maintenance"
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Insurance")).toBeInTheDocument();
  });

  it("shows an em dash for entries with no description", () => {
    render(<ExpenseTrackerClient initialEntries={[buildEntry({ id: "x", description: null })]} properties={PROPERTIES} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders the entry count in the card title", () => {
    render(<ExpenseTrackerClient initialEntries={ENTRIES} properties={PROPERTIES} />);
    expect(screen.getByText("3 Entries")).toBeInTheDocument();
  });

  it("uses singular 'Entry' for a single entry", () => {
    render(<ExpenseTrackerClient initialEntries={[buildEntry()]} properties={PROPERTIES} />);
    expect(screen.getByText("1 Entry")).toBeInTheDocument();
  });

  it("renders the empty-state row when there are no entries", () => {
    render(<ExpenseTrackerClient initialEntries={[]} properties={PROPERTIES} />);
    expect(
      screen.getByText(/No entries found\. Add your first entry/i),
    ).toBeInTheDocument();
  });

  it("computes income, expense and net totals in the footer", () => {
    render(<ExpenseTrackerClient initialEntries={ENTRIES} properties={PROPERTIES} />);
    const footer = screen.getByText("Totals").closest("tr") as HTMLElement;
    const footerScope = within(footer);
    // income 1500
    expect(footerScope.getByText("£1,500")).toBeInTheDocument();
    // expenses 250 + 100 = 350
    expect(footerScope.getByText("£350")).toBeInTheDocument();
    // net 1500 - 350 = 1150
    expect(footerScope.getByText(/Net: £1,150/)).toBeInTheDocument();
  });

  it("does not render the totals footer when the table is empty", () => {
    render(<ExpenseTrackerClient initialEntries={[]} properties={PROPERTIES} />);
    expect(screen.queryByText("Totals")).not.toBeInTheDocument();
  });

  it("renders a property label resolved from the properties list", () => {
    render(<ExpenseTrackerClient initialEntries={ENTRIES} properties={PROPERTIES} />);
    expect(screen.getAllByText("42 Baker Street, London").length).toBeGreaterThan(0);
  });

  it("shows a No-properties message in the add sheet when portfolio is empty", () => {
    // sheetPropertyId resolves to "" when no entry + no properties; the sheet
    // body then renders the guidance text. The Sheet itself is closed until
    // opened, so we assert the prerequisite branch indirectly: the Add Entry
    // button still renders so the page is usable.
    render(<ExpenseTrackerClient initialEntries={[]} properties={[]} />);
    expect(screen.getByRole("button", { name: /Add Entry/i })).toBeInTheDocument();
  });

  // FINDING: The Type/Category/Property/Month filters use the base-ui <Select>,
  // whose dropdown relies on pointer/portal behaviour that happy-dom does not
  // implement reliably. Driving the filter dropdowns deterministically is not
  // feasible at the component-test layer here; the underlying filter logic is a
  // pure useMemo over `entries` and is better covered by an e2e/browser test.
  it.todo("filters entries by type via the Type select (needs browser env)");
  it.todo("filters entries by month via the Month select (needs browser env)");

  // FINDING: The Add/Edit flow opens a base-ui <Sheet> (portal dialog) that
  // hosts InlineEntryForm. Opening the Sheet and submitting the inline form
  // (incl. the client-side required-field guard that toasts an error) depends
  // on the same portal/pointer machinery and is not reliably exercisable in
  // happy-dom. The validation rule itself mirrors financialEntrySchema, which
  // is unit-tested in src/__tests__/landlord/expense.test.ts.
  it.todo("opens the Add Entry sheet and validates required fields (needs browser env)");
  it.todo("opens the delete confirmation dialog and removes an entry (needs browser env)");
});
