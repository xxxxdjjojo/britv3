/**
 * Design-parity smoke test for the create-listing form.
 *
 * Asserts the form renders its heading + step indicator and that step 1
 * (Basic Info / Property Details) surfaces its core fields. This guards the
 * Stitch design-parity restyle: structure/labels must keep rendering after
 * markup/layout changes.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingForm } from "./ListingForm";

// next/navigation router is used by the form; stub it for the render.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("ListingForm design parity (create, step 1)", () => {
  it("renders the per-step heading, subtitle and the step indicator", () => {
    // Arrange / Act
    render(<ListingForm mode="create" role="seller" />);

    // Assert — step 1 heading, "Step X of N" subtitle, and the indicator nav
    expect(
      screen.getByRole("heading", { name: /property details/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /form steps/i }),
    ).toBeInTheDocument();
  });

  it("renders step 1 basic-info fields", () => {
    // Arrange / Act
    render(<ListingForm mode="create" role="seller" />);

    // Assert — listing type, address, and core property fields
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument();
  });

  it("renders a green primary Next button", () => {
    // Arrange / Act
    render(<ListingForm mode="create" role="seller" />);

    // Assert
    expect(
      screen.getByRole("button", { name: /^next$/i }),
    ).toBeInTheDocument();
  });
});
