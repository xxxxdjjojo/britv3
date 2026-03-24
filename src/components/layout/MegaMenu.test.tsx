import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MegaMenu } from "./MegaMenu";

// Mock next/link to render plain <a> tags
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("MegaMenu", () => {
  it("renders 6 top-level navigation items", () => {
    render(<MegaMenu />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const buttons = nav.querySelectorAll("button");
    expect(buttons).toHaveLength(6);
  });

  it("has aria-label='Main navigation' on the nav element", () => {
    render(<MegaMenu />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("all triggers use text-base font size", () => {
    render(<MegaMenu />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const buttons = nav.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.className).toContain("text-base");
    });
  });

  it("'List / Sell' item has distinct CTA styling", () => {
    render(<MegaMenu />);
    const ctaButton = screen.getByRole("button", { name: /List \/ Sell/i });
    expect(ctaButton.className).toMatch(/brand-secondary|text-amber|text-yellow/);
  });

  it("opens dropdown on click and shows section headings", () => {
    render(<MegaMenu />);
    const buyButton = screen.getByRole("button", { name: /Buy/i });
    fireEvent.click(buyButton);

    // Buy has sections: Search, Data, Tools, Guides
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Guides")).toBeInTheDocument();
  });

  it("each dropdown section has a heading element", () => {
    render(<MegaMenu />);
    const buyButton = screen.getByRole("button", { name: /Buy/i });
    fireEvent.click(buyButton);

    // Section headings should be h3 elements
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.length).toBeGreaterThanOrEqual(4); // Buy has 4 sections
  });

  it("all links in dropdown are <a> tags with href attributes", () => {
    render(<MegaMenu />);
    const buyButton = screen.getByRole("button", { name: /Buy/i });
    fireEvent.click(buyButton);

    const panel = screen.getByTestId("mega-menu-panel");
    const links = panel.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("Escape closes an open dropdown", () => {
    render(<MegaMenu />);
    const buyButton = screen.getByRole("button", { name: /Buy/i });
    fireEvent.click(buyButton);

    // Panel should be visible
    expect(screen.getByTestId("mega-menu-panel")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    // Panel should be gone
    expect(screen.queryByTestId("mega-menu-panel")).not.toBeInTheDocument();
  });

  it("sets aria-expanded on trigger when open", () => {
    render(<MegaMenu />);
    const buyButton = screen.getByRole("button", { name: /Buy/i });
    expect(buyButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(buyButton);
    expect(buyButton).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking a different trigger switches the dropdown", () => {
    render(<MegaMenu />);
    const buyButton = screen.getByRole("button", { name: /Buy/i });
    const rentButton = screen.getByRole("button", { name: /Rent/i });

    fireEvent.click(buyButton);
    expect(screen.getByText("Sold Prices")).toBeInTheDocument(); // Buy-specific

    fireEvent.click(rentButton);
    expect(screen.queryByText("Sold Prices")).not.toBeInTheDocument();
    expect(screen.getByText("Rental Search")).toBeInTheDocument(); // Rent-specific
  });
});
