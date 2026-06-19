// Render tests for the property-detail EPC band (current + potential).
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EPCDisplay } from "./EPCDisplay";

describe("EPCDisplay", () => {
  it("renders the current rating and score", () => {
    render(<EPCDisplay currentRating="D" currentScore={64} />);
    expect(screen.getByText(/Rating D/)).toBeTruthy();
    expect(screen.getByText("64/100")).toBeTruthy();
  });

  it("renders the potential rating and score when provided", () => {
    render(
      <EPCDisplay
        currentRating="D"
        currentScore={64}
        potentialRating="C"
        potentialScore={73}
      />,
    );
    expect(screen.getByText("Potential:")).toBeTruthy();
    // potential band chip + "C (73) — …"
    expect(screen.getByText(/C \(73\)/)).toBeTruthy();
  });

  it("omits the potential section when no potential rating", () => {
    render(<EPCDisplay currentRating="D" currentScore={64} />);
    expect(screen.queryByText("Potential:")).toBeNull();
  });

  it("shows a fallback when there is no EPC", () => {
    render(<EPCDisplay currentRating={null} />);
    expect(screen.getByText(/EPC data not available/)).toBeTruthy();
    expect(screen.queryByText(/Rating/)).toBeNull();
  });
});
