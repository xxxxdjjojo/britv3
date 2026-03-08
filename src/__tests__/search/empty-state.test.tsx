import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
