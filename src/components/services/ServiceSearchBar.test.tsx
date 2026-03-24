import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceSearchBar } from "./ServiceSearchBar";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

import { trackEvent } from "@/lib/analytics/track-event";

describe("ServiceSearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders service type input with correct placeholder", () => {
    render(<ServiceSearchBar />);
    expect(
      screen.getByPlaceholderText("Service (e.g. Plumber, Electrician)"),
    ).toBeInTheDocument();
  });

  it("renders location input with correct placeholder", () => {
    render(<ServiceSearchBar />);
    expect(
      screen.getByPlaceholderText("Location or Postcode"),
    ).toBeInTheDocument();
  });

  it("renders a search button", () => {
    render(<ServiceSearchBar />);
    expect(
      screen.getByRole("button", { name: /search/i }),
    ).toBeInTheDocument();
  });

  it("navigates to correct URL with query params on submit", () => {
    render(<ServiceSearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText("Service (e.g. Plumber, Electrician)"),
      { target: { value: "Plumber" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("Location or Postcode"),
      { target: { value: "London" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(mockPush).toHaveBeenCalledWith(
      "/services/tradespeople?category=Plumber&location=London",
    );
  });

  it("navigates to base URL when fields are empty", () => {
    render(<ServiceSearchBar />);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(mockPush).toHaveBeenCalledWith("/services/tradespeople");
  });

  it("calls trackEvent on submit", () => {
    render(<ServiceSearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText("Service (e.g. Plumber, Electrician)"),
      { target: { value: "Electrician" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("Location or Postcode"),
      { target: { value: "SW1A 1AA" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(trackEvent).toHaveBeenCalledWith("services_search_submit", {
      category: "Electrician",
      location: "SW1A 1AA",
    });
  });

  it("calls trackEvent with empty strings when fields are empty", () => {
    render(<ServiceSearchBar />);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(trackEvent).toHaveBeenCalledWith("services_search_submit", {
      category: "",
      location: "",
    });
  });
});
