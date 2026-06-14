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
});
