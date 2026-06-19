import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/search/EmptyState";

describe("EmptyState", () => {
  it("renders the empty state message", () => {
    render(<EmptyState />);
    expect(screen.getByText("No properties match your filters")).toBeInTheDocument();
  });

  it("shows suggestion bullets", () => {
    render(<EmptyState />);
    expect(screen.getAllByText(/widening your search area/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Adjust your budget/).length).toBeGreaterThan(0);
  });

  it("shows alert CTA link", () => {
    render(<EmptyState />);
    const links = screen.getAllByRole("link", { name: /alert/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/search");
  });

  it("accepts custom title and description", () => {
    render(<EmptyState title="Nothing here" description="Custom message" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Custom message")).toBeInTheDocument();
  });
});

describe("EmptyState — soldWithin coverage hint", () => {
  it("does not show the land-registry hint when soldWithin is 'all'", () => {
    render(<EmptyState state={{ soldWithin: "all" }} onChange={() => {}} />);
    expect(
      screen.queryByText(/Only listings whose last sale is in HM Land Registry/),
    ).not.toBeInTheDocument();
  });

  it("shows the land-registry hint when soldWithin is active", () => {
    render(<EmptyState state={{ soldWithin: "6m" }} onChange={() => {}} />);
    expect(
      screen.getByText(/Only listings whose last sale is in HM Land Registry/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show all/i })).toBeInTheDocument();
  });

  it("resets soldWithin to 'all' when the Show all button is clicked", () => {
    const onChange = vi.fn();
    render(<EmptyState state={{ soldWithin: "12m" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /show all/i }));
    expect(onChange).toHaveBeenCalledWith({ soldWithin: "all" });
  });

  it("renders without the optional state/onChange props (back-compat)", () => {
    render(<EmptyState />);
    expect(
      screen.queryByText(/Only listings whose last sale is in HM Land Registry/),
    ).not.toBeInTheDocument();
  });
});
