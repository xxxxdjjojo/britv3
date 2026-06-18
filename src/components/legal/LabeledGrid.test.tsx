import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabeledGrid } from "./LabeledGrid";

describe("LabeledGrid", () => {
  it("renders each cell title and description", () => {
    render(
      <LabeledGrid
        cells={[
          { title: "Stripe", description: "Payments" },
          { title: "Supabase", description: "Database" },
        ]}
      />,
    );

    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Supabase")).toBeInTheDocument();
  });

  it("renders cells without a description", () => {
    render(<LabeledGrid cells={[{ title: "Age" }]} columns={3} />);
    expect(screen.getByText("Age")).toBeInTheDocument();
  });
});
