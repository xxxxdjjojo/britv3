/**
 * Design-parity render tests for ActiveListings.
 * Only change design-related code: layout, spacing, typography, colors,
 * borders, radius, shadows, responsive behavior, component structure, and UI states.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActiveListings } from "./ActiveListings";

// ---------------------------------------------------------------------------
// Mocks — Next.js Link
// ---------------------------------------------------------------------------

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LISTING_ACTIVE = {
  id: "listing-1",
  title: "The Glass Pavilion",
  address_line_1: "1 Example Street",
  city: "London",
  postcode: "W1A 1AA",
  price: 4250000,
  status: "active",
  primary_image_url: "",
  views: 2411,
  saves: 142,
  enquiries: 16,
  bedrooms: 5,
  bathrooms: 3,
  created_at: "2024-01-10T10:00:00Z",
};

const LISTING_UNDER_OFFER = {
  id: "listing-2",
  title: "Eaton Square Mews",
  address_line_1: "2 Eaton Square",
  city: "London",
  postcode: "SW1W 9BG",
  price: 2950000,
  status: "under offer",
  primary_image_url: "",
  views: 987,
  saves: 54,
  enquiries: 8,
  bedrooms: 3,
  bathrooms: 2,
  created_at: "2024-01-05T10:00:00Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ActiveListings", () => {
  it("renders the page heading with listing count", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE, LISTING_UNDER_OFFER]} />);
    expect(
      screen.getByRole("heading", { name: /Active Listings \(2\)/i }),
    ).toBeInTheDocument();
  });

  it("renders an article card for each listing", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE, LISTING_UNDER_OFFER]} />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
  });

  it("displays listing title text", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE]} />);
    expect(screen.getByText("The Glass Pavilion")).toBeInTheDocument();
  });

  it("displays formatted GBP price", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE]} />);
    expect(screen.getByText("£4,250,000")).toBeInTheDocument();
  });

  it("displays status chip text", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE]} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("displays city and postcode location", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE]} />);
    expect(screen.getByText("London, W1A 1AA")).toBeInTheDocument();
  });

  it("renders analytics link with correct href", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE]} />);
    const link = screen.getByRole("link", { name: /view analytics/i });
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/agent/listings/listing-1/analytics",
    );
  });

  it("shows the sort select", () => {
    render(<ActiveListings listings={[LISTING_ACTIVE]} />);
    // SelectTrigger renders a button with the current value
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows empty state when no listings", () => {
    render(<ActiveListings listings={[]} />);
    expect(
      screen.getByText("No active listings found."),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("keeps existing string copy unchanged — 'Active Listings'", () => {
    render(<ActiveListings listings={[]} />);
    expect(screen.getByText(/Active Listings \(0\)/)).toBeInTheDocument();
  });
});
