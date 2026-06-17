import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductsPage from "./page";

describe("ProductsPage (broker products)", () => {
  it("renders the Product Database heading", () => {
    render(<ProductsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /product database/i }),
    ).toBeInTheDocument();
  });

  it("renders the Available Products section header", () => {
    render(<ProductsPage />);
    expect(
      screen.getByRole("heading", { name: /available products/i }),
    ).toBeInTheDocument();
  });

  it("renders product cards for the mock data", () => {
    render(<ProductsPage />);
    // Lender names from MOCK_PRODUCTS
    expect(screen.getAllByText("Natwest").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HSBC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Barclays").length).toBeGreaterThan(0);
  });

  it("renders a Request Quote button for each product", () => {
    render(<ProductsPage />);
    const quoteButtons = screen.getAllByRole("button", { name: /request quote/i });
    expect(quoteButtons.length).toBeGreaterThan(0);
  });

  it("renders the Market Trends Analysis section", () => {
    render(<ProductsPage />);
    expect(
      screen.getByRole("heading", { name: /market trends analysis/i }),
    ).toBeInTheDocument();
  });

  it("renders the Smart Match Pro insight panel", () => {
    render(<ProductsPage />);
    expect(screen.getByText(/smart match pro/i)).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<ProductsPage />);
    expect(
      screen.getByPlaceholderText(/search by lender or product code/i),
    ).toBeInTheDocument();
  });
});
