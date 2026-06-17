// M3-A1 — Rent presentational rows: status badges, mark-paid interaction,
// and the derived RentStatusIndicator.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Table, TableBody } from "@/components/ui/table";
import { RentPaymentRow } from "@/components/landlord/RentPaymentRow";
import { RentStatusIndicator } from "@/components/landlord/RentStatusIndicator";
import type { FinancialEntry } from "@/types/landlord";

type RowEntry = FinancialEntry & {
  tenant_name: string;
  property_address: string;
};

function buildEntry(overrides: Partial<RowEntry>): RowEntry {
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
    tenant_name: "Jane Tenant",
    property_address: "42 Baker Street",
    ...overrides,
  };
}

function renderRow(entry: RowEntry, onMarkPaid = vi.fn()) {
  return {
    onMarkPaid,
    ...render(
      <Table>
        <TableBody>
          <RentPaymentRow entry={entry} onMarkPaid={onMarkPaid} />
        </TableBody>
      </Table>,
    ),
  };
}

describe("RentPaymentRow — render with data", () => {
  it("renders tenant, address, formatted amount and due date", () => {
    renderRow(buildEntry({ amount: 1500 }));
    expect(screen.getByText("Jane Tenant")).toBeInTheDocument();
    expect(screen.getByText("42 Baker Street")).toBeInTheDocument();
    expect(screen.getByText("£1,500")).toBeInTheDocument();
    expect(screen.getByText("1 Jun 2026")).toBeInTheDocument();
  });

  it("renders the Paid badge and hides Mark Paid for paid entries", () => {
    renderRow(buildEntry({ payment_status: "paid" }));
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Mark Paid/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the Overdue badge and a Mark Paid button for overdue entries", () => {
    renderRow(buildEntry({ payment_status: "overdue" }));
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark Paid/ })).toBeInTheDocument();
  });

  it("renders the Partial badge with a Mark Paid button", () => {
    renderRow(buildEntry({ payment_status: "partial" }));
    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark Paid/ })).toBeInTheDocument();
  });

  it("falls back to Overdue styling when payment_status is null", () => {
    renderRow(buildEntry({ payment_status: null }));
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("renders em-dashes for missing tenant/address/date", () => {
    renderRow(
      buildEntry({ tenant_name: "", property_address: "", entry_date: "" }),
    );
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("calls onMarkPaid with the entry id when Mark Paid is clicked", () => {
    const { onMarkPaid } = renderRow(buildEntry({ id: "fin-42", payment_status: "overdue" }));
    fireEvent.click(screen.getByRole("button", { name: /Mark Paid/ }));
    expect(onMarkPaid).toHaveBeenCalledWith("fin-42");
  });
});

describe("RentStatusIndicator — derived status", () => {
  // Use a far-past lease start so the current rent period is active and deterministic.
  const tenancy = {
    lease_start_date: "2020-01-01",
    rent_amount: 1500,
    rent_frequency: "monthly",
  };

  it("shows Paid when rent payments meet the amount in the current period", () => {
    render(
      <RentStatusIndicator
        tenancy={tenancy}
        payments={[
          { category: "rent", entry_date: futureSafeDate(), amount: 1500 },
        ]}
      />,
    );
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows Overdue and £0 paid when there are no payments in the period", () => {
    render(<RentStatusIndicator tenancy={tenancy} payments={[]} />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText(/£0 \/ £1,500/)).toBeInTheDocument();
  });

  it("shows Not Due when the lease has not started yet", () => {
    render(
      <RentStatusIndicator
        tenancy={{ ...tenancy, lease_start_date: "2099-01-01" }}
        payments={[]}
      />,
    );
    expect(screen.getByText("Not Due")).toBeInTheDocument();
  });
});

// A date guaranteed to be inside any current monthly period and not in the future
// for the period filter (entry_date >= periodStart). "Today" is always valid.
function futureSafeDate(): string {
  return new Date().toISOString().slice(0, 10);
}
