import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ActiveListings } from "@/components/dashboard/agent/listings/ActiveListings";
import { ACTIVE_LISTINGS, makeListing } from "./fixtures";

/**
 * Returns the visible card titles in DOM order. The component renders each
 * listing title in a `<p class="font-medium ...">` followed by the price; we
 * read the rendered order to verify the default (newest-first) sort.
 */
function renderedTitles(): string[] {
  return screen
    .getAllByText(/^(A|B|C) —/)
    .map((el) => el.textContent ?? "");
}

describe("ActiveListings — render with data", () => {
  it("renders heading with the listing count", () => {
    render(<ActiveListings listings={ACTIVE_LISTINGS} />);
    expect(
      screen.getByRole("heading", { name: /Active Listings \(3\)/ }),
    ).toBeInTheDocument();
  });

  it("renders a card per listing with formatted GBP price and stats", () => {
    render(<ActiveListings listings={[makeListing({ id: "x", title: "1 Mock Street", price: 300000, views: 100, saves: 10, enquiries: 5 })]} />);
    expect(screen.getByText("1 Mock Street")).toBeInTheDocument();
    expect(screen.getByText("£300,000")).toBeInTheDocument();
    // views / saves / enquiries appear as separate icon+number spans. Each
    // number is rendered with its own leading glyph, so match the whole span
    // text to avoid the /10/-matches-100 ambiguity.
    const stats = screen.getByText(/100/).closest("div");
    expect(stats).not.toBeNull();
    expect(within(stats as HTMLElement).getByText(/100/)).toBeInTheDocument();
    expect(within(stats as HTMLElement).getByText(/(^|\s)10(\s|$)/)).toBeInTheDocument();
    expect(within(stats as HTMLElement).getByText(/(^|\s)5(\s|$)/)).toBeInTheDocument();
  });

  it("links each card to its analytics page", () => {
    render(<ActiveListings listings={[makeListing({ id: "abc" })]} />);
    const link = screen.getByRole("link", { name: /View analytics/ });
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/agent/listings/abc/analytics",
    );
  });

  it("falls back to address_line_1 then 'Untitled' when title missing", () => {
    render(
      <ActiveListings
        listings={[
          makeListing({ id: "1", title: undefined, address_line_1: "5 Fallback Ave" }),
          makeListing({ id: "2", title: undefined, address_line_1: undefined }),
        ]}
      />,
    );
    expect(screen.getByText("5 Fallback Ave")).toBeInTheDocument();
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("renders 'No image' placeholder when primary_image_url missing", () => {
    render(<ActiveListings listings={[makeListing({ id: "1", primary_image_url: undefined })]} />);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });
});

describe("ActiveListings — empty state", () => {
  it("shows the empty message and (0) count when there are no listings", () => {
    render(<ActiveListings listings={[]} />);
    expect(
      screen.getByRole("heading", { name: /Active Listings \(0\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("No active listings found.")).toBeInTheDocument();
  });
});

describe("ActiveListings — default sort (newest first)", () => {
  it("orders listings by created_at descending by default", () => {
    render(<ActiveListings listings={ACTIVE_LISTINGS} />);
    // B (2026-03), C (2026-02), A (2026-01)
    expect(renderedTitles()).toEqual([
      expect.stringContaining("B —"),
      expect.stringContaining("C —"),
      expect.stringContaining("A —"),
    ]);
  });
});

describe("ActiveListings — sort dropdown", () => {
  it("renders the sort trigger with all four options after opening", async () => {
    render(<ActiveListings listings={ACTIVE_LISTINGS} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);

    // Radix renders the option labels into the DOM once opened. We assert the
    // four supported sort options are all available.
    expect(await screen.findByText("Newest First")).toBeInTheDocument();
    expect(screen.getByText("Price High-Low")).toBeInTheDocument();
    expect(screen.getByText("Price Low-High")).toBeInTheDocument();
    expect(screen.getByText("Most Views")).toBeInTheDocument();
  });

  // FINDING: Radix Select item selection is pointer-capture driven and does not
  // commit `onValueChange` under happy-dom (clicking/Enter on the option does
  // not update the controlled value — verified via probe). The sort LOGIC for
  // price_high / price_low / most_views therefore cannot be exercised through
  // the real dropdown in this environment. Default-sort (newest) is covered
  // above; the remaining branches need a jsdom+user-event setup or a refactor
  // exposing the sort comparator. Not faked.
  it.todo("re-sorts by Price High-Low when selected from the dropdown");
  it.todo("re-sorts by Price Low-High when selected from the dropdown");
  it.todo("re-sorts by Most Views when selected from the dropdown");
});
