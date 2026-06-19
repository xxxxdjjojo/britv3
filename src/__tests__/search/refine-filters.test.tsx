import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RefineFilters } from "@/components/search/RefineFilters";
import { DEFAULT_SEARCH_STATE } from "@/lib/search/url-state";

const baseProps = () => ({
  state: { ...DEFAULT_SEARCH_STATE },
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onClear: vi.fn(),
});

describe("RefineFilters — bedrooms min/max", () => {
  it("renders a single 'Bedrooms' label with Min and Max selects", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.getByText(/^Bedrooms$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max bedrooms/i)).toBeInTheDocument();
  });

  it("emits bedsMin on min change", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.change(screen.getByLabelText(/min bedrooms/i), {
      target: { value: "2" },
    });
    expect(props.onChange).toHaveBeenCalledWith({ bedsMin: "2" });
  });

  it("emits bedsMax on max change", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.change(screen.getByLabelText(/max bedrooms/i), {
      target: { value: "4" },
    });
    expect(props.onChange).toHaveBeenCalledWith({ bedsMax: "4" });
  });

  it("clamps Max up to Min when Min > Max on commit", () => {
    const props = {
      ...baseProps(),
      state: { ...DEFAULT_SEARCH_STATE, bedsMin: "4" as const, bedsMax: "2" as const },
    };
    render(<RefineFilters {...props} />);
    fireEvent.submit(screen.getByTestId("refine-filters"));
    expect(props.onSubmit).toHaveBeenCalled();
    const clampCall = props.onChange.mock.calls.find((c) => c[0].bedsMax === "4");
    expect(clampCall).toBeDefined();
  });
});
