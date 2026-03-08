import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonalizedEstimate } from "./PersonalizedEstimate";

const mockParams = {
  deposit: 50000,
  interestRate: 4.5,
  termYears: 25,
};

vi.mock("@/hooks/useMortgageParams", () => ({
  useMortgageParams: vi.fn(),
}));

// Mock tooltip to always render content visibly
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

import { useMortgageParams } from "@/hooks/useMortgageParams";
const mockUseMortgageParams = vi.mocked(useMortgageParams);

describe("PersonalizedEstimate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no params saved", () => {
    mockUseMortgageParams.mockReturnValue({
      params: null,
      saveParams: vi.fn(),
      clearParams: vi.fn(),
      hasParams: false,
    });

    const { container } = render(
      <PersonalizedEstimate propertyPrice={300000} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders 'Est. X/mo' when params exist", () => {
    mockUseMortgageParams.mockReturnValue({
      params: mockParams,
      saveParams: vi.fn(),
      clearParams: vi.fn(),
      hasParams: true,
    });

    render(<PersonalizedEstimate propertyPrice={300000} />);
    // With 250K principal, 4.5% rate, 25 years, monthly payment is ~1,390
    const badge = screen.getByText(/Est\. .+\/mo/);
    expect(badge).toBeDefined();
  });

  it("renders correct formatted amount using GBP currency", () => {
    mockUseMortgageParams.mockReturnValue({
      params: mockParams,
      saveParams: vi.fn(),
      clearParams: vi.fn(),
      hasParams: true,
    });

    render(<PersonalizedEstimate propertyPrice={300000} />);
    const badges = screen.getAllByText(/Est\./);
    expect(badges.length).toBeGreaterThan(0);
    const badge = badges[0];
    expect(badge.textContent).toContain("/mo");
    // Should contain a pound sign (GBP formatting)
    expect(badge.textContent).toMatch(/\u00a3/);
  });

  it("includes tooltip with parameter details", () => {
    mockUseMortgageParams.mockReturnValue({
      params: mockParams,
      saveParams: vi.fn(),
      clearParams: vi.fn(),
      hasParams: true,
    });

    render(<PersonalizedEstimate propertyPrice={300000} />);
    const tooltips = screen.getAllByTestId("tooltip-content");
    expect(tooltips.length).toBeGreaterThan(0);
    const tooltip = tooltips[0];
    expect(tooltip.textContent).toContain("4.5%");
    expect(tooltip.textContent).toContain("25 years");
  });

  it("includes link to /tools/mortgage-calculator", () => {
    mockUseMortgageParams.mockReturnValue({
      params: mockParams,
      saveParams: vi.fn(),
      clearParams: vi.fn(),
      hasParams: true,
    });

    render(<PersonalizedEstimate propertyPrice={300000} />);
    const link = document.querySelector(
      'a[href="/tools/mortgage-calculator"]',
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Adjust");
  });
});
