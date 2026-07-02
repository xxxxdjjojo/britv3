import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import { buildMovingStack } from "@/lib/calculators/moving-stack";
import { SELLER_PLANS } from "@/lib/billing-config";
import MovingCostEstimatorPage, { metadata } from "./page";

const DEFAULT_PRICE = 300000;

function toggleSelling() {
  fireEvent.click(
    screen.getByRole("switch", { name: /I'm also selling a property/i }),
  );
}

describe("Total Cost of Moving page", () => {
  it("exports metadata", () => {
    expect(String(metadata.title)).toContain("Total Cost of Moving");
  });

  it("renders the SDLT line with the exact figure from calculateSdlt", () => {
    render(<MovingCostEstimatorPage />);

    expect(screen.getByText("Stamp Duty Land Tax (SDLT)")).toBeInTheDocument();

    const expected = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(calculateSdlt(DEFAULT_PRICE, "standard").totalTax);
    expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
  });

  it("renders a source citation for every line item in the full (selling) stack", () => {
    render(<MovingCostEstimatorPage />);
    toggleSelling();

    const items = buildMovingStack({
      propertyPrice: DEFAULT_PRICE,
      location: "england",
      buyerType: "standard",
      selling: true,
    }).items;

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.source, `${item.key} must ship with a source`).toBeDefined();
      const links = screen.getAllByRole("link", {
        name: item.source!.label,
      });
      expect(links.length, `citation link for ${item.key}`).toBeGreaterThan(0);
      expect(
        links.some((link) => link.getAttribute("href") === item.source!.url),
      ).toBe(true);
    }
  });

  it("hides EPC, commission, portal, and TrueDeed comparison when not selling", () => {
    render(<MovingCostEstimatorPage />);

    expect(
      screen.queryByText("EPC certificate (selling)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Traditional estate agent commission (selling)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Portal cost embedded in your listing/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/vs TrueDeed's real tiers/i),
    ).not.toBeInTheDocument();
  });

  it("shows the selling lines and all 4 TrueDeed tier names from billing-config when selling", () => {
    render(<MovingCostEstimatorPage />);
    toggleSelling();

    expect(screen.getByText("EPC certificate (selling)")).toBeInTheDocument();
    expect(
      screen.getByText("Traditional estate agent commission (selling)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Portal cost embedded in your listing/i),
    ).toBeInTheDocument();

    expect(SELLER_PLANS).toHaveLength(4);
    for (const plan of SELLER_PLANS) {
      expect(
        screen.getByText(plan.name),
        `TrueDeed tier ${plan.id}`,
      ).toBeInTheDocument();
    }
    expect(screen.getByText(/Cheapest at this price/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /See full fee transparency/i }),
    ).toHaveAttribute("href", "/fee-transparency");
  });

  it("labels the portal line an estimate and links its editable assumptions", () => {
    render(<MovingCostEstimatorPage />);
    toggleSelling();

    expect(screen.getAllByText("Estimate").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Edit the assumptions on \/tools\/portal-cost-calculator/i),
    ).toBeInTheDocument();
  });

  it("keeps the related tools and solicitor CTA sidebar", () => {
    render(<MovingCostEstimatorPage />);

    expect(screen.getByText("Stamp Duty Calculator")).toBeInTheDocument();
    expect(screen.getByText("Mortgage Calculator")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Get Quotes/i }),
    ).toHaveAttribute("href", "/marketplace?category=conveyancing");
  });
});
