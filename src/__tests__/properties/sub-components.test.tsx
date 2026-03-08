import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloorPlan } from "@/components/properties/FloorPlan";
import { PriceHistory } from "@/components/properties/PriceHistory";
import { ViewingBooking } from "@/components/properties/ViewingBooking";

describe("FloorPlan", () => {
  it("renders nothing when no floors", () => {
    const { container } = render(<FloorPlan floors={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders floor tabs when multiple floors", () => {
    render(
      <FloorPlan
        floors={[
          { label: "Ground Floor", imageUrl: "/g.jpg" },
          { label: "First Floor", imageUrl: "/f.jpg" },
        ]}
      />
    );
    expect(screen.getByText("Ground Floor")).toBeInTheDocument();
    expect(screen.getByText("First Floor")).toBeInTheDocument();
  });
});

describe("PriceHistory", () => {
  it("renders nothing when empty", () => {
    const { container } = render(<PriceHistory history={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders current price when data present", () => {
    render(
      <PriceHistory
        history={[
          { date: "2025-01-01", price: 400000 },
          { date: "2025-06-01", price: 425000 },
        ]}
      />
    );
    expect(screen.getByText("Current Price")).toBeInTheDocument();
    expect(screen.getByText("£425,000")).toBeInTheDocument();
  });
});

describe("ViewingBooking", () => {
  it("renders booking heading", () => {
    render(<ViewingBooking agentName="James Wilson" propertyAddress="14 Elm Road" />);
    expect(screen.getByText("Book a Viewing")).toBeInTheDocument();
  });

  it("shows in-person and virtual options", () => {
    render(<ViewingBooking agentName="James Wilson" propertyAddress="14 Elm Road" />);
    expect(screen.getAllByText("In Person").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Virtual").length).toBeGreaterThan(0);
  });
});
