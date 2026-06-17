import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OffersDashboard } from "@/components/dashboard/agent/offers/OffersDashboard";
import { GROUPED_OFFERS, makeOffer } from "./fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockReset();
});

describe("OffersDashboard — grouping + render", () => {
  it("renders one card group per property with an offer count badge", () => {
    render(<OffersDashboard grouped={GROUPED_OFFERS} />);
    // Property A has 2 offers, Property B has 1.
    expect(screen.getByText("2 offers")).toBeInTheDocument();
    expect(screen.getByText("1 offer")).toBeInTheDocument();
  });

  it("renders every buyer name across the groups", () => {
    render(<OffersDashboard grouped={GROUPED_OFFERS} />);
    expect(screen.getByText("Alice Buyer")).toBeInTheDocument();
    expect(screen.getByText("Bob Bidder")).toBeInTheDocument();
    expect(screen.getByText("Carol Client")).toBeInTheDocument();
  });

  it("renders the formatted GBP amount and status label per offer", () => {
    render(
      <OffersDashboard
        grouped={{
          p1: [makeOffer({ id: "o", amount: 300000, status: "accepted" })],
        }}
      />,
    );
    expect(screen.getByText("£300,000")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
  });

  it("renders the AIP status badge label for each AIP state", () => {
    render(
      <OffersDashboard
        grouped={{
          p1: [makeOffer({ id: "v", aip_status: "verified" })],
          p2: [makeOffer({ id: "n", property_id: "p2", aip_status: "not_provided" })],
        }}
      />,
    );
    expect(screen.getByText("AIP Verified")).toBeInTheDocument();
    expect(screen.getByText("No AIP")).toBeInTheDocument();
  });

  it("navigates to the offer detail page when a card is clicked", () => {
    render(
      <OffersDashboard
        grouped={{ p1: [makeOffer({ id: "offer-99" })] }}
      />,
    );
    fireEvent.click(screen.getByText("Alice Buyer"));
    expect(push).toHaveBeenCalledWith("/dashboard/agent/offers/offer-99");
  });
});

describe("OffersDashboard — empty states", () => {
  it("shows the no-offers-yet message when grouped is empty", () => {
    render(<OffersDashboard grouped={{}} />);
    expect(screen.getByText("No offers found")).toBeInTheDocument();
    expect(
      screen.getByText("No offers have been received yet."),
    ).toBeInTheDocument();
  });

  it("shows the no-match message when a search filters everything out", () => {
    render(<OffersDashboard grouped={GROUPED_OFFERS} />);
    fireEvent.change(screen.getByPlaceholderText("Search by buyer name…"), {
      target: { value: "zzzzz-no-such-buyer" },
    });
    expect(screen.getByText("No offers found")).toBeInTheDocument();
    expect(
      screen.getByText("No offers match your current filters."),
    ).toBeInTheDocument();
  });
});

describe("OffersDashboard — search filter (controlled input)", () => {
  it("filters offers by buyer name, case-insensitively", () => {
    render(<OffersDashboard grouped={GROUPED_OFFERS} />);
    fireEvent.change(screen.getByPlaceholderText("Search by buyer name…"), {
      target: { value: "bob" },
    });
    expect(screen.getByText("Bob Bidder")).toBeInTheDocument();
    expect(screen.queryByText("Alice Buyer")).not.toBeInTheDocument();
    expect(screen.queryByText("Carol Client")).not.toBeInTheDocument();
  });

  it("drops a group entirely when none of its offers match", () => {
    render(<OffersDashboard grouped={GROUPED_OFFERS} />);
    fireEvent.change(screen.getByPlaceholderText("Search by buyer name…"), {
      target: { value: "carol" },
    });
    // Property B (Carol) survives with 1 offer; Property A is gone.
    expect(screen.getByText("Carol Client")).toBeInTheDocument();
    expect(screen.getByText("1 offer")).toBeInTheDocument();
    expect(screen.queryByText("2 offers")).not.toBeInTheDocument();
  });
});

describe("OffersDashboard — status filter dropdown", () => {
  it("renders the status filter trigger with all options after opening", async () => {
    render(<OffersDashboard grouped={GROUPED_OFFERS} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(await screen.findByText("All statuses")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Countered")).toBeInTheDocument();
    expect(screen.getByText("Withdrawn")).toBeInTheDocument();
  });

  // FINDING: as with ActiveListings, Radix Select item selection does not
  // commit onValueChange under happy-dom, so the status-filter LOGIC cannot be
  // exercised through the real dropdown. The equivalent filtering branch is
  // still covered via the search input above (same useMemo predicate). The
  // status-only branch needs jsdom+user-event or a comparator extraction.
  it.todo("filters offers to accepted-only when 'Accepted' is selected");
});
