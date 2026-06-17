import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RatingStars } from "@/components/reviews/RatingStars";

// RatingStars maps a numeric rating to full/half/empty star icons.
// lucide-react renders <svg> elements; we assert on counts via class probes.

function countStars(container: HTMLElement) {
  const all = container.querySelectorAll("svg");
  const filled = container.querySelectorAll("svg.fill-brand-secondary");
  return { total: all.length, filled: filled.length };
}

describe("RatingStars", () => {
  it("renders 5 star icons total for a whole rating", () => {
    const { container } = render(<RatingStars rating={3} />);
    expect(countStars(container).total).toBe(5);
  });

  it("fills exactly N stars for an integer rating", () => {
    const { container } = render(<RatingStars rating={4} />);
    // 4 full stars filled, 1 empty
    expect(countStars(container).filled).toBe(4);
  });

  it("renders a half star for a .5 rating (still 5 icons total)", () => {
    const { container } = render(<RatingStars rating={3.5} />);
    // 3 full + 1 half + 1 empty = 5 icons; half is also fill-brand-secondary
    expect(countStars(container).total).toBe(5);
    expect(countStars(container).filled).toBe(4); // 3 full + 1 half
  });

  it("clamps ratings above 5 to all filled", () => {
    const { container } = render(<RatingStars rating={9} />);
    expect(countStars(container).filled).toBe(5);
  });

  it("clamps negative ratings to zero filled", () => {
    const { container } = render(<RatingStars rating={-2} />);
    expect(countStars(container).filled).toBe(0);
    expect(countStars(container).total).toBe(5);
  });

  it("shows numeric value with one decimal when showValue is set", () => {
    const { getByText } = render(<RatingStars rating={4.25} showValue />);
    expect(getByText("4.3")).toBeInTheDocument();
  });

  it("does not render numeric value by default", () => {
    const { container } = render(<RatingStars rating={4} />);
    expect(container.textContent).toBe("");
  });

  it.each(["sm", "md", "lg"] as const)("accepts size '%s' without error", (size) => {
    const { container } = render(<RatingStars rating={3} size={size} />);
    expect(countStars(container).total).toBe(5);
  });
});
