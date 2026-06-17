import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { OfferCompareTable } from "@/components/seller/offers/OfferCompareTable";
import { makeOffer } from "./_fixtures";

describe("OfferCompareTable (SELL-11)", () => {
  it("renders 9 data rows for any non-empty offer set", () => {
    render(<OfferCompareTable offers={[makeOffer(), makeOffer({ id: "offer-2", buyer_name: "Bob" })]} />);

    const rowLabels = [
      "Offer Amount",
      "vs Asking",
      "Buyer",
      "Buyer Type",
      "Chain Status",
      "Chain Length",
      "Verified",
      "Submitted",
      "Status",
    ];
    for (const label of rowLabels) {
      expect(screen.getByRole("cell", { name: label })).toBeInTheDocument();
    }
    // tbody rows = 9 data rows
    const bodyRows = screen.getAllByRole("row").filter((r) => within(r).queryAllByRole("cell").length > 0);
    expect(bodyRows).toHaveLength(9);
  });

  it("shows buyer names as column headers", () => {
    render(
      <OfferCompareTable
        offers={[
          makeOffer({ id: "o1", buyer_name: "Alice Buyer" }),
          makeOffer({ id: "o2", buyer_name: "Bob Buyer" }),
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Alice Buyer" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Bob Buyer" })).toBeInTheDocument();
  });

  it("slices to the first 3 offers (max 3 buyer columns + 1 Detail column)", () => {
    const offers = Array.from({ length: 5 }, (_, i) =>
      makeOffer({ id: `o${i}`, buyer_name: `Buyer ${i}` }),
    );
    render(<OfferCompareTable offers={offers} />);

    const headerRow = screen.getAllByRole("row")[0];
    const headerCells = within(headerRow).getAllByRole("columnheader");
    // "Detail" + 3 buyers
    expect(headerCells).toHaveLength(4);
    expect(screen.queryByRole("columnheader", { name: "Buyer 3" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Buyer 4" })).not.toBeInTheDocument();
  });

  it("computes vs-asking percentage relative to the first offer's listing asking price", () => {
    const listing = { ...makeOffer().listing!, asking_price: 35000000 };
    render(
      <OfferCompareTable
        offers={[
          makeOffer({ id: "o1", amount: 35000000, listing }),
          makeOffer({ id: "o2", amount: 36000000, listing }),
        ]}
      />,
    );
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("2.9%")).toBeInTheDocument();
  });

  it("renders em-dash for vs-asking when listing asking price is missing", () => {
    render(
      <OfferCompareTable
        offers={[
          makeOffer({ id: "o1", listing: undefined }),
          makeOffer({ id: "o2", listing: undefined }),
        ]}
      />,
    );
    // Both vs-asking cells render the em-dash fallback
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  // EMPTY state: component renders a headerless table with no buyer columns.
  it("renders the static row labels even with an empty offer set", () => {
    render(<OfferCompareTable offers={[]} />);
    expect(screen.getByRole("cell", { name: "Offer Amount" })).toBeInTheDocument();
    expect(screen.queryAllByRole("columnheader", { name: /Buyer/ })).toHaveLength(0);
  });
});
