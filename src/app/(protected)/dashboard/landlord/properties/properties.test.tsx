import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const getPortfolioPropertiesMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({}),
}));

vi.mock("@/services/landlord/portfolio-service", () => ({
  getPortfolioProperties: (...args: unknown[]) =>
    getPortfolioPropertiesMock(...args),
}));

import PropertiesPage from "./page";

function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: "prop-1",
    address_line_1: "12 Cadogan Square",
    address_line_2: null,
    city: "Knightsbridge",
    postcode: "SW1X 0HT",
    property_type: "flat",
    bedrooms: 3,
    listing_id: "listing-1",
    tenant_name: "Alexander Sterling",
    tenancy_status: "active",
    rent_amount: 3450,
    rent_frequency: "month",
    lease_end_date: "2025-10-14",
    open_maintenance_count: 0,
    expiring_documents_count: 0,
    ...overrides,
  };
}

async function renderPage() {
  await act(async () => {
    render(<PropertiesPage />);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PropertiesPage (Portfolio View)", () => {
  it("renders the large Portfolio heading", async () => {
    getPortfolioPropertiesMock.mockResolvedValue([]);
    await renderPage();

    expect(
      screen.getByRole("heading", { name: /^portfolio$/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the empty state with an add-property action", async () => {
    getPortfolioPropertiesMock.mockResolvedValue([]);
    await renderPage();

    expect(screen.getByText(/no properties yet/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /add new property/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders a property row with address and rent when properties exist", async () => {
    getPortfolioPropertiesMock.mockResolvedValue([makeProperty()]);
    await renderPage();

    expect(screen.getByText("12 Cadogan Square")).toBeInTheDocument();
    expect(screen.getByText(/£3,450/)).toBeInTheDocument();
    expect(screen.getByText(/Knightsbridge, SW1X 0HT/)).toBeInTheDocument();
  });

  it("renders summary tiles with occupancy when properties exist", async () => {
    getPortfolioPropertiesMock.mockResolvedValue([makeProperty()]);
    await renderPage();

    expect(screen.getByText(/^occupancy$/i)).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
