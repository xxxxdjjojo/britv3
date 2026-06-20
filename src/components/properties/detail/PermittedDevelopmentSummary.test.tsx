import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermittedDevelopmentSummary } from "./PermittedDevelopmentSummary";

describe("PermittedDevelopmentSummary", () => {
  it("renders the scenario list and caveat for a house type", () => {
    render(<PermittedDevelopmentSummary propertyType="detached" />);
    expect(screen.getByText("Rear/single-storey extension")).toBeInTheDocument();
    expect(screen.getByText("Loft / dormer conversion")).toBeInTheDocument();
    expect(
      screen.getByText(/Always confirm with your local planning authority/i),
    ).toBeInTheDocument();
  });

  it("renders the not-applicable message and caveat for a flat", () => {
    render(<PermittedDevelopmentSummary propertyType="flat" />);
    expect(
      screen.getByText(/Permitted development rights generally don't apply/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Rear/single-storey extension")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Always confirm with your local planning authority/i),
    ).toBeInTheDocument();
  });
});
