import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeasibilityBadge } from "./FeasibilityBadge";

describe("FeasibilityBadge", () => {
  it("renders the permitted label", () => {
    render(<FeasibilityBadge feasibility="likely_permitted" />);
    expect(screen.getByText("Likely permitted development")).toBeInTheDocument();
  });

  it("renders the needs-planning label", () => {
    render(<FeasibilityBadge feasibility="needs_full_planning" />);
    expect(screen.getByText("Likely needs full planning")).toBeInTheDocument();
  });

  it("renders the not-applicable label", () => {
    render(<FeasibilityBadge feasibility="not_applicable" />);
    expect(screen.getByText("Not applicable")).toBeInTheDocument();
  });
});
