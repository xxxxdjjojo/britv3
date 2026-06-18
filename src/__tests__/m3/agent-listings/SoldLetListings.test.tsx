import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SoldLetListings } from "@/components/dashboard/agent/listings/SoldLetListings";
import { SOLD_LET_LISTINGS, makeListing } from "./fixtures";

describe("SoldLetListings — render with data", () => {
  it("renders the heading with the count", () => {
    render(<SoldLetListings listings={SOLD_LET_LISTINGS} />);
    expect(
      screen.getByRole("heading", { name: /Sold & Let Listings \(2\)/ }),
    ).toBeInTheDocument();
  });

  it("renders a SOLD badge and formatted price for a sold listing", () => {
    render(
      <SoldLetListings
        listings={[makeListing({ id: "s", status: "sold", title: "Sold home", price: 425000 })]}
      />,
    );
    expect(screen.getByText("SOLD")).toBeInTheDocument();
    expect(screen.getByText("Sold home")).toBeInTheDocument();
    expect(screen.getByText("£425,000")).toBeInTheDocument();
  });

  it("renders a LET badge for a non-sold listing", () => {
    render(
      <SoldLetListings
        listings={[makeListing({ id: "l", status: "let", title: "Let flat" })]}
      />,
    );
    expect(screen.getByText("LET")).toBeInTheDocument();
  });

  it("shows commission only when commission_amount > 0", () => {
    render(
      <SoldLetListings
        listings={[
          makeListing({ id: "s1", status: "sold", commission_amount: 6375 }),
          makeListing({ id: "l1", status: "let", commission_amount: 0 }),
        ]}
      />,
    );
    expect(screen.getByText(/Commission: £6,375/)).toBeInTheDocument();
    // Only one commission badge — the zero-commission listing has none.
    expect(screen.getAllByText(/Commission:/)).toHaveLength(1);
  });

  it("computes days on market from created_at and updated_at", () => {
    render(
      <SoldLetListings
        listings={[
          makeListing({
            id: "s",
            status: "sold",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-31T00:00:00Z",
          }),
        ]}
      />,
    );
    // 30 days between the two dates
    expect(screen.getByText(/30 days on market/)).toBeInTheDocument();
  });

  it("renders singular 'day' when exactly one day on market", () => {
    render(
      <SoldLetListings
        listings={[
          makeListing({
            id: "s",
            status: "sold",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
          }),
        ]}
      />,
    );
    expect(screen.getByText(/1 day on market/)).toBeInTheDocument();
  });

  it("renders 'No image' placeholder when image url missing", () => {
    render(
      <SoldLetListings
        listings={[makeListing({ id: "s", status: "sold", primary_image_url: undefined })]}
      />,
    );
    expect(screen.getByText("No image")).toBeInTheDocument();
  });
});

describe("SoldLetListings — empty state", () => {
  it("shows the empty message when there are no listings", () => {
    render(<SoldLetListings listings={[]} />);
    expect(
      screen.getByRole("heading", { name: /Sold & Let Listings \(0\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No sold or let listings found."),
    ).toBeInTheDocument();
  });
});
