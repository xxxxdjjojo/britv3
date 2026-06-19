/**
 * M3-A8 — Saved searches: SavedSearchActions component.
 *
 * Covers the "Run" action (builds the /search URL from the saved filters and
 * navigates) and the "Delete" action (fires the delete mutation, disabled while
 * pending). The TanStack Query mutation hook and the Next router are mocked so
 * the test stays deterministic and never touches the network.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SavedSearchActions } from "@/components/listings/SavedSearchActions";
import type { SavedSearch } from "@/types/property";

const mockPush = vi.fn();
const mockDeleteMutate = vi.fn();
let mockDeleteIsPending = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/useSavedSearches", () => ({
  useDeleteSearch: () => ({
    mutate: mockDeleteMutate,
    isPending: mockDeleteIsPending,
  }),
}));

function makeSearch(
  overrides: Partial<SavedSearch> = {},
): SavedSearch {
  return {
    id: "search-1",
    user_id: "user-1",
    name: "City flats under 400k",
    filters: {
      listing_type: "sale",
      min_price: 200_000,
      max_price: 400_000,
      min_bedrooms: 2,
      property_type: ["flat", "terraced"],
    },
    alerts_enabled: true,
    alert_frequency: "daily",
    last_alerted_at: null,
    new_results_count: 0,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("SavedSearchActions", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockDeleteMutate.mockReset();
    mockDeleteIsPending = false;
  });

  it("renders Run and Delete actions", () => {
    render(<SavedSearchActions search={makeSearch()} />);
    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("Run builds the /search URL from the saved filters and navigates", () => {
    render(<SavedSearchActions search={makeSearch()} />);

    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const url = mockPush.mock.calls[0][0] as string;
    expect(url.startsWith("/search?")).toBe(true);
    const params = new URLSearchParams(url.slice("/search?".length));
    expect(params.get("listing_type")).toBe("sale");
    expect(params.get("min_price")).toBe("200000");
    expect(params.get("max_price")).toBe("400000");
    expect(params.get("min_bedrooms")).toBe("2");
    expect(params.get("property_type")).toBe("flat,terraced");
  });

  it("omits filters that are not set", () => {
    render(
      <SavedSearchActions
        search={makeSearch({ filters: { listing_type: "rent" } })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    const url = mockPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.slice("/search?".length));
    expect(params.get("listing_type")).toBe("rent");
    expect(params.has("min_price")).toBe(false);
    expect(params.has("property_type")).toBe(false);
  });

  it("serialises the new_build boolean filter", () => {
    render(
      <SavedSearchActions
        search={makeSearch({ filters: { new_build: true } })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    const url = mockPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.slice("/search?".length));
    expect(params.get("new_build")).toBe("true");
  });

  it("Delete fires the delete mutation with the search id", () => {
    render(<SavedSearchActions search={makeSearch({ id: "abc-123" })} />);

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(mockDeleteMutate).toHaveBeenCalledWith({ searchId: "abc-123" });
  });

  it("disables Delete while the mutation is pending", () => {
    mockDeleteIsPending = true;
    render(<SavedSearchActions search={makeSearch()} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });
});
