import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarketMapFilters } from "./MarketMapFilters";

function renderFilters(
  overrides: Partial<Parameters<typeof MarketMapFilters>[0]> = {},
) {
  const onPropertyTypeChange = vi.fn();
  const onApply = vi.fn();
  render(
    <MarketMapFilters
      propertyType="all"
      onPropertyTypeChange={onPropertyTypeChange}
      onApply={onApply}
      {...overrides}
    />,
  );
  return { onPropertyTypeChange, onApply };
}

describe("MarketMapFilters (property-type only)", () => {
  it("renders the property-type chips", () => {
    renderFilters();
    expect(screen.getByRole("group", { name: "Property type" })).toBeInTheDocument();
    for (const label of [
      "All types",
      "Detached",
      "Semi-detached",
      "Terraced",
      "Flat / apartment",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active type with aria-pressed", () => {
    renderFilters({ propertyType: "flat" });
    expect(screen.getByRole("button", { name: "Flat / apartment" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All types" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("fires onPropertyTypeChange with the chosen type", () => {
    const { onPropertyTypeChange } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Terraced" }));
    expect(onPropertyTypeChange).toHaveBeenCalledWith("terraced");
  });

  it("fires onApply when Apply Filters is clicked", () => {
    const { onApply } = renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Apply Filters" }));
    expect(onApply).toHaveBeenCalled();
  });

  it("no longer renders the date-window, metric or scale controls", () => {
    renderFilters();
    expect(screen.queryByText("Date Window")).not.toBeInTheDocument();
    expect(screen.queryByText("Last 12 months")).not.toBeInTheDocument();
    expect(screen.queryByText("Metric")).not.toBeInTheDocument();
    expect(screen.queryByText("Median sold price")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Scale mode" })).not.toBeInTheDocument();
  });
});
