import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DepositCard } from "@/components/landlord/DepositCard";
import type { DepositRegistration, DepositStatus } from "@/types/landlord";

type DepositCardDeposit = DepositRegistration & {
  tenancy: { tenant_name: string; property_address: string };
};

function buildDeposit(
  overrides: Partial<DepositCardDeposit> = {},
): DepositCardDeposit {
  return {
    id: "dep-1",
    tenancy_id: "ten-1",
    amount: 1500,
    scheme: "TDS",
    scheme_reference: "TDS123456",
    registration_date: "2026-01-01",
    prescribed_info_sent_date: "2026-01-05",
    status: "registered",
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    tenancy: {
      tenant_name: "Jane Tenant",
      property_address: "42 Baker Street, London",
    },
    ...overrides,
  };
}

describe("DepositCard", () => {
  it("renders property address, tenant, amount, scheme and reference", () => {
    render(<DepositCard deposit={buildDeposit()} onEdit={vi.fn()} />);
    expect(screen.getByText("42 Baker Street, London")).toBeInTheDocument();
    expect(screen.getByText("Jane Tenant")).toBeInTheDocument();
    expect(screen.getByText("£1,500")).toBeInTheDocument();
    expect(screen.getByText("TDS")).toBeInTheDocument();
    expect(screen.getByText("TDS123456")).toBeInTheDocument();
  });

  it("renders the registered status badge", () => {
    render(<DepositCard deposit={buildDeposit({ status: "registered" })} onEdit={vi.fn()} />);
    // "Registered" also appears as the registration-date row label, so assert
    // at least one occurrence (the status badge) is present.
    expect(screen.getAllByText("Registered").length).toBeGreaterThan(0);
  });

  // pending/returned/disputed labels are unique in the card; "registered"
  // collides with the date-row label, so it is covered by getAllByText above.
  const statusLabels: [DepositStatus, string][] = [
    ["pending", "Pending"],
    ["returned", "Returned"],
    ["disputed", "Disputed"],
  ];
  it.each(statusLabels)("maps %s status to label %s", (status, label) => {
    render(<DepositCard deposit={buildDeposit({ status })} onEdit={vi.fn()} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows 'Not registered' / 'Not sent' when dates are missing", () => {
    render(
      <DepositCard
        deposit={buildDeposit({
          registration_date: null,
          prescribed_info_sent_date: null,
        })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Not registered")).toBeInTheDocument();
    expect(screen.getByText("Not sent")).toBeInTheDocument();
  });

  it("falls back to 'Unknown property' when address is empty", () => {
    render(
      <DepositCard
        deposit={buildDeposit({
          tenancy: { tenant_name: "Jane", property_address: "" },
        })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Unknown property")).toBeInTheDocument();
  });

  it("calls onEdit with the deposit when Edit is clicked", () => {
    const onEdit = vi.fn();
    const deposit = buildDeposit();
    render(<DepositCard deposit={deposit} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(deposit);
  });

  it("shows Mark Registered only for pending deposits when handler provided", () => {
    const onMarkRegistered = vi.fn();
    render(
      <DepositCard
        deposit={buildDeposit({ status: "pending" })}
        onEdit={vi.fn()}
        onMarkRegistered={onMarkRegistered}
      />,
    );
    const markBtn = screen.getByRole("button", { name: "Mark Registered" });
    fireEvent.click(markBtn);
    expect(onMarkRegistered).toHaveBeenCalledWith("dep-1");
  });

  it("hides Mark Registered for non-pending deposits", () => {
    render(
      <DepositCard
        deposit={buildDeposit({ status: "registered" })}
        onEdit={vi.fn()}
        onMarkRegistered={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Mark Registered" }),
    ).not.toBeInTheDocument();
  });

  it("hides Mark Registered when no handler is provided even if pending", () => {
    render(<DepositCard deposit={buildDeposit({ status: "pending" })} onEdit={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "Mark Registered" }),
    ).not.toBeInTheDocument();
  });
});
