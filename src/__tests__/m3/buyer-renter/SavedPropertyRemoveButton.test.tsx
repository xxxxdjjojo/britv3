/**
 * M3-A8 — Saved properties: SavedPropertyRemoveButton.
 *
 * Covers render (accessible label), the remove interaction (fires the unsave
 * mutation with the listing id), and the disabled state while the mutation is
 * pending. The TanStack Query mutation hook is mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SavedPropertyRemoveButton } from "@/components/listings/SavedPropertyRemoveButton";

const mockUnsaveMutate = vi.fn();
let mockUnsaveIsPending = false;

vi.mock("@/hooks/useSavedProperties", () => ({
  useUnsaveProperty: () => ({
    mutate: mockUnsaveMutate,
    isPending: mockUnsaveIsPending,
  }),
}));

describe("SavedPropertyRemoveButton", () => {
  beforeEach(() => {
    mockUnsaveMutate.mockReset();
    mockUnsaveIsPending = false;
  });

  it("renders with an accessible remove label", () => {
    render(<SavedPropertyRemoveButton listingId="listing-1" />);
    expect(
      screen.getByRole("button", { name: /remove from saved/i }),
    ).toBeInTheDocument();
  });

  it("fires the unsave mutation with the listing id on click", () => {
    render(<SavedPropertyRemoveButton listingId="listing-xyz" />);

    fireEvent.click(
      screen.getByRole("button", { name: /remove from saved/i }),
    );

    expect(mockUnsaveMutate).toHaveBeenCalledWith({ listingId: "listing-xyz" });
  });

  it("disables the button while the unsave mutation is pending", () => {
    mockUnsaveIsPending = true;
    render(<SavedPropertyRemoveButton listingId="listing-1" />);
    expect(
      screen.getByRole("button", { name: /remove from saved/i }),
    ).toBeDisabled();
  });
});
