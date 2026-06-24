import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const redirectMock = vi.fn();
const getSavedPropertiesMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@/services/saved/saved-properties-service", () => ({
  getSavedProperties: (...args: unknown[]) => getSavedPropertiesMock(...args),
}));

// The remove button is a client component with hooks; stub it for rendering.
vi.mock("@/components/listings/SavedPropertyRemoveButton", () => ({
  SavedPropertyRemoveButton: () => <button aria-label="Remove from saved" />,
}));

import SavedPropertiesPage from "./page";

function makeSaved(overrides: Record<string, unknown> = {}) {
  return {
    id: "saved-1",
    user_id: "user-1",
    listing_id: "listing-1",
    notes: null,
    created_at: "2026-01-01",
    listing: {
      id: "listing-1",
      slug: "the-glass-pavilion",
      price: 4250000,
      listing_type: "sale",
      status: "active",
      rent_frequency: null,
      favorite_count: 3,
    },
    property: {
      title: "The Glass Pavilion",
      address_line1: "Cotswolds",
      city: "Oxfordshire",
      bedrooms: 5,
      bathrooms: 4,
      square_footage: 4200,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("SavedPropertiesPage", () => {
  it("renders the editorial heading", async () => {
    getSavedPropertiesMock.mockResolvedValue([]);
    render(await SavedPropertiesPage());

    expect(
      screen.getByRole("heading", { name: /saved properties/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the empty state when no properties are saved", async () => {
    getSavedPropertiesMock.mockResolvedValue([]);
    render(await SavedPropertiesPage());

    expect(screen.getByText(/no saved properties yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /search properties/i }),
    ).toBeInTheDocument();
  });

  it("renders a property card with price and stats", async () => {
    getSavedPropertiesMock.mockResolvedValue([makeSaved()]);
    render(await SavedPropertiesPage());

    expect(screen.getByText("The Glass Pavilion")).toBeInTheDocument();
    expect(screen.getByText(/£4,250,000/)).toBeInTheDocument();
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("4,200")).toBeInTheDocument();
  });

  it("renders the Add Property dashed tile alongside saved cards", async () => {
    getSavedPropertiesMock.mockResolvedValue([makeSaved()]);
    render(await SavedPropertiesPage());

    expect(
      screen.getByRole("link", { name: /add property/i }),
    ).toBeInTheDocument();
  });

  it("renders the compare control on each card", async () => {
    getSavedPropertiesMock.mockResolvedValue([makeSaved()]);
    render(await SavedPropertiesPage());

    expect(screen.getByText("Compare")).toBeInTheDocument();
  });

  // --- Regression: RLS hides under_offer/sold/withdrawn listings from non-owners,
  //     so the embedded listing comes back null. The page must NOT crash. ---

  it("does not crash when a saved listing is no longer available (null embed)", async () => {
    getSavedPropertiesMock.mockResolvedValue([
      makeSaved({ id: "saved-gone", listing: null, property: null }),
    ]);

    render(await SavedPropertiesPage());

    // The shortlist still renders, with a graceful 'no longer available' card.
    expect(
      screen.getByRole("heading", { name: /saved properties/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
  });

  it("renders an 'Under offer' badge for a saved listing that is under offer", async () => {
    getSavedPropertiesMock.mockResolvedValue([
      makeSaved({
        listing: {
          id: "listing-1",
          slug: "the-glass-pavilion",
          price: 4250000,
          listing_type: "sale",
          status: "under_offer",
          rent_frequency: null,
          favorite_count: 3,
        },
      }),
    ]);

    render(await SavedPropertiesPage());

    expect(screen.getByText(/under offer/i)).toBeInTheDocument();
  });

  it("renders a 'Sold' badge for a saved listing that has sold", async () => {
    getSavedPropertiesMock.mockResolvedValue([
      makeSaved({
        listing: {
          id: "listing-1",
          slug: "the-glass-pavilion",
          price: 4250000,
          listing_type: "sale",
          status: "sold",
          rent_frequency: null,
          favorite_count: 3,
        },
      }),
    ]);

    render(await SavedPropertiesPage());

    expect(screen.getByText(/^sold$/i)).toBeInTheDocument();
  });

  // Every non-active status must surface a badge so a saver always knows why a
  // listing they shortlisted is no longer freely on the market. `draft` is now
  // reachable for non-owners because saved listings are visible regardless of
  // status (RLS migration 20260624152444).
  it.each([
    ["draft", /not currently listed/i],
    ["under_offer", /under offer/i],
    ["sold_stc", /sold stc/i],
    ["sold", /^sold$/i],
    ["let", /^let$/i],
    ["withdrawn", /withdrawn/i],
    ["archived", /archived/i],
  ])("renders a status badge for a '%s' listing", async (status, label) => {
    getSavedPropertiesMock.mockResolvedValue([
      makeSaved({
        listing: {
          id: "listing-1",
          slug: "the-glass-pavilion",
          price: 4250000,
          listing_type: "sale",
          status,
          rent_frequency: null,
          favorite_count: 3,
        },
      }),
    ]);

    render(await SavedPropertiesPage());

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders no status badge for an active listing", async () => {
    getSavedPropertiesMock.mockResolvedValue([makeSaved()]);
    render(await SavedPropertiesPage());

    // 'active' is the only status with no badge; the card still renders.
    expect(screen.getByText("The Glass Pavilion")).toBeInTheDocument();
    expect(screen.queryByText(/not currently listed/i)).not.toBeInTheDocument();
  });

  it("renders a working property-detail link on each available card", async () => {
    getSavedPropertiesMock.mockResolvedValue([makeSaved()]);
    render(await SavedPropertiesPage());

    const links = screen
      .getAllByRole("link")
      .filter((a) =>
        a.getAttribute("href")?.startsWith("/properties/the-glass-pavilion"),
      );
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders mixed available and unavailable saved items together without crashing", async () => {
    getSavedPropertiesMock.mockResolvedValue([
      makeSaved(),
      makeSaved({ id: "saved-gone", listing: null, property: null }),
    ]);

    render(await SavedPropertiesPage());

    expect(screen.getByText("The Glass Pavilion")).toBeInTheDocument();
    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
  });
});
