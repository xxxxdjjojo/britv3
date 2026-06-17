import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const redirectMock = vi.fn();
const getMyListingsMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@/services/listings/listing-service", () => ({
  getMyListings: (...args: unknown[]) => getMyListingsMock(...args),
}));

import MyListingsPage from "./page";

function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    listing: {
      id: "listing-1",
      status: "active",
      price: 485000,
      listed_date: "2026-01-05",
      view_count: 2800,
      favorite_count: 42,
      enquiry_count: 12,
      ...((overrides.listing as Record<string, unknown>) ?? {}),
    },
    property: {
      title: "22 Oak Lane",
      address_line1: "Cotswolds",
      city: "Gloucester",
      postcode: "GL54",
    },
    media: [{ thumbnail_url: null }],
  };
}

function renderPage() {
  return MyListingsPage({
    params: Promise.resolve({ role: "seller" }),
    searchParams: Promise.resolve({}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("MyListingsPage", () => {
  it("renders the editorial My Listings heading", async () => {
    getMyListingsMock.mockResolvedValue({ data: [], count: 0 });
    render(await renderPage());

    expect(
      screen.getByRole("heading", { name: /my listings/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the primary create action", async () => {
    getMyListingsMock.mockResolvedValue({ data: [], count: 0 });
    render(await renderPage());

    expect(
      screen.getByRole("link", { name: /create new listing/i }),
    ).toBeInTheDocument();
  });

  it("renders the empty state when there are no listings", async () => {
    getMyListingsMock.mockResolvedValue({ data: [], count: 0 });
    render(await renderPage());

    expect(screen.getByText(/no listings yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create listing/i }),
    ).toBeInTheDocument();
  });

  it("renders a listing row with title, price, status pill and key stats", async () => {
    getMyListingsMock.mockResolvedValue({
      data: [makeListing()],
      count: 1,
    });
    render(await renderPage());

    expect(screen.getByText("22 Oak Lane")).toBeInTheDocument();
    expect(screen.getByText(/£485,000/)).toBeInTheDocument();
    // "Active" appears as both the tab trigger and the row's status pill.
    expect(screen.getAllByText("Active").length).toBeGreaterThan(1);
    expect(screen.getByText("Views")).toBeInTheDocument();
    expect(screen.getByText("Saves")).toBeInTheDocument();
    expect(screen.getByText("Enquiries")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
