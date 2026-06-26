import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalculatorPageHeader } from "./CalculatorPageHeader";

describe("CalculatorPageHeader", () => {
  it("renders a single left-aligned, extrabold h1 at the canonical size", () => {
    render(
      <CalculatorPageHeader
        title="Mortgage Repayment Calculator"
        description="Estimate your monthly repayments."
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);

    const className = headings[0].className;
    expect(className).toContain("text-4xl");
    expect(className).toContain("md:text-5xl");
    expect(className).toContain("font-extrabold");
    expect(className).not.toContain("text-center");
  });

  it("renders the description when provided", () => {
    render(
      <CalculatorPageHeader
        title="Stamp Duty Land Tax Calculator"
        description="Calculate SDLT, LBTT or LTT."
      />,
    );
    expect(screen.getByText("Calculate SDLT, LBTT or LTT.")).toBeInTheDocument();
  });

  it("omits the description paragraph when none is provided", () => {
    const { container } = render(<CalculatorPageHeader title="X" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("does not render its own breadcrumb (the global layout owns that)", () => {
    render(<CalculatorPageHeader title="X" />);
    // No <nav> breadcrumb here — duplicating the global one is the bug we fixed.
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("link", { name: "Tools" })).toBeNull();
  });

  it("renders hero children such as badges or stat rows", () => {
    render(
      <CalculatorPageHeader title="X">
        <span data-testid="hero-extra">100% Free</span>
      </CalculatorPageHeader>,
    );
    expect(screen.getByTestId("hero-extra")).toBeInTheDocument();
  });
});
