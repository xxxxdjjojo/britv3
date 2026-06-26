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

describe("RefineFilters — soldWithin", () => {
  it("renders all four sold-within options with 'Show all' selected by default", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.getByLabelText("3 months")).toBeInTheDocument();
    expect(screen.getByLabelText("6 months")).toBeInTheDocument();
    expect(screen.getByLabelText("12 months")).toBeInTheDocument();
    const showAll = screen.getByLabelText("Show all") as HTMLInputElement;
    expect(showAll.checked).toBe(true);
  });

  it("emits soldWithin on selection", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.click(screen.getByLabelText("6 months"));
    expect(props.onChange).toHaveBeenCalledWith({ soldWithin: "6m" });
  });

  it("renders sold-within section before Price Range", () => {
    render(<RefineFilters {...baseProps()} />);
    const sold = screen.getByText(/sold within the last few/i);
    const price = screen.getByText(/^Price Range/i);
    const cmp = sold.compareDocumentPosition(price);
    expect(cmp & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("RefineFilters — amenities & features", () => {
  it("renders the amenities chips", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.getByText(/amenities & features/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Garden" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "In-unit laundry" })).toBeInTheDocument();
  });

  it("toggles a slug into mustHaves when a chip is clicked", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Garden" }));
    expect(props.onChange).toHaveBeenCalledWith({ mustHaves: ["garden"] });
  });

  it("marks an already-selected amenity as pressed", () => {
    const props = {
      ...baseProps(),
      state: { ...DEFAULT_SEARCH_STATE, mustHaves: ["lift"] },
    };
    render(<RefineFilters {...props} />);
    expect(screen.getByRole("button", { name: "Lift" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("RefineFilters — council tax band", () => {
  it("renders all eight bands", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.getByText(/council tax band/i)).toBeInTheDocument();
    for (const band of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
      expect(
        screen.getByRole("button", { name: `Council tax band ${band}` }),
      ).toBeInTheDocument();
    }
  });

  it("toggles a band into councilTaxBands", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Council tax band C" }));
    expect(props.onChange).toHaveBeenCalledWith({ councilTaxBands: ["C"] });
  });
});

describe("RefineFilters — keywords", () => {
  it("emits keywords on input", () => {
    const props = baseProps();
    render(<RefineFilters {...props} />);
    fireEvent.change(screen.getByLabelText(/keywords/i), {
      target: { value: "balcony" },
    });
    expect(props.onChange).toHaveBeenCalledWith({ keywords: "balcony" });
  });
});

describe("RefineFilters — short-term let (rent only)", () => {
  it("is hidden for sale searches", () => {
    render(<RefineFilters {...baseProps()} />);
    expect(screen.queryByText(/short-term let available/i)).not.toBeInTheDocument();
  });

  it("renders and emits for rent searches", () => {
    const props = {
      ...baseProps(),
      state: { ...DEFAULT_SEARCH_STATE, listingType: "rent" as const },
    };
    render(<RefineFilters {...props} />);
    const checkbox = screen.getByLabelText(/short-term let available/i);
    expect(checkbox).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(props.onChange).toHaveBeenCalledWith({ shortTermLet: true });
  });
});
