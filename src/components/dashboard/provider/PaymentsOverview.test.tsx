import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PaymentsOverview } from "./PaymentsOverview";
import type { StripeBalance, PayoutRecord } from "@/services/provider/provider-payment-service";

const baseBalance: StripeBalance = {
  availablePence: 1245000,
  pendingPence: 218000,
  currency: "gbp",
  nextPayoutDate: "2026-06-16T00:00:00Z",
  nextPayoutAmountPence: 95000,
};

const basePayout: PayoutRecord = {
  id: "po_test_1",
  amountPence: 129000,
  status: "paid",
  initiatedAt: "2023-10-24T10:00:00Z",
  arrivedAt: "2023-10-26T10:00:00Z",
  bankLast4: "4892",
};

describe("PaymentsOverview", () => {
  it("renders the Payout History heading", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[basePayout]} />);
    expect(screen.getByText("Payout History")).toBeInTheDocument();
  });

  it("renders all three KPI tile labels", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[basePayout]} />);
    expect(screen.getByText("Available Balance")).toBeInTheDocument();
    expect(screen.getByText("Total Earnings YTD")).toBeInTheDocument();
    expect(screen.getByText("Pending Balance")).toBeInTheDocument();
  });

  it("renders the available balance amount", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[basePayout]} />);
    // £12,450.00 appears in the available tile (and possibly total YTD)
    const tiles = screen.getAllByText("£12,450.00");
    expect(tiles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the payout ETA banner when nextPayoutDate is set", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[basePayout]} />);
    expect(screen.getByText(/Next payout:/)).toBeInTheDocument();
  });

  it("omits the payout ETA banner when nextPayoutDate is null", () => {
    const noEta: StripeBalance = { ...baseBalance, nextPayoutDate: null, nextPayoutAmountPence: null };
    render(<PaymentsOverview balance={noEta} payouts={[basePayout]} />);
    expect(screen.queryByText(/Next payout:/)).not.toBeInTheDocument();
  });

  it("shows empty state when there are no payouts", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[]} />);
    expect(screen.getByText("No payouts yet")).toBeInTheDocument();
  });

  it("renders Earnings Projection and Payout Destination sections", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[basePayout]} />);
    expect(screen.getByText("Earnings Projection")).toBeInTheDocument();
    expect(screen.getByText("Payout Destination")).toBeInTheDocument();
  });

  it("renders a Paid status badge in the desktop table row", () => {
    render(<PaymentsOverview balance={baseBalance} payouts={[basePayout]} />);
    // Table has header + badge; find the badge inside the table
    const table = screen.getByRole("table");
    const paidBadges = within(table).getAllByText("Paid");
    expect(paidBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders a FAILED status badge with Resolve button", () => {
    const failedPayout: PayoutRecord = { ...basePayout, id: "po_test_2", status: "failed" };
    render(<PaymentsOverview balance={baseBalance} payouts={[failedPayout]} />);
    expect(screen.getByText("Resolve")).toBeInTheDocument();
  });
});
