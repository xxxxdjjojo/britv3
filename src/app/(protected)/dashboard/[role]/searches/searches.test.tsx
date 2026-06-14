import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SavedSearch } from "@/types/property";
import SavedSearchesPage from "./page";

const mockOrder = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: mockOrder,
        })),
      })),
    })),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/components/listings/SavedSearchActions", () => ({
  SavedSearchActions: () => <div data-testid="saved-search-actions" />,
}));

const baseSearch: SavedSearch = {
  id: "search-1",
  user_id: "user-1",
  name: "Isleworth, 3-bed",
  filters: { listing_type: "sale", min_bedrooms: 3, max_price: 500000 },
  alerts_enabled: true,
  alert_frequency: "instant",
  last_alerted_at: new Date("2026-06-01T10:42:00Z"),
  new_results_count: 12,
  created_at: new Date("2026-05-01T00:00:00Z"),
  updated_at: new Date("2026-05-01T00:00:00Z"),
};

describe("SavedSearchesPage", () => {
  it("renders the heading and a saved-search card", async () => {
    mockOrder.mockResolvedValueOnce({ data: [baseSearch] });

    render(await SavedSearchesPage());

    expect(
      screen.getByRole("heading", { name: /saved searches & alerts/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Isleworth, 3-bed")).toBeInTheDocument();
    expect(screen.getByText(/12 New Properties/i)).toBeInTheDocument();
  });

  it("renders the empty state when there are no searches", async () => {
    mockOrder.mockResolvedValueOnce({ data: [] });

    render(await SavedSearchesPage());

    expect(
      screen.getByRole("heading", { name: /saved searches & alerts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /start a new hunt/i }),
    ).toBeInTheDocument();
  });
});
