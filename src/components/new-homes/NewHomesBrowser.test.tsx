import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NewHomesBrowser } from "./NewHomesBrowser";
import type { DevelopmentCard } from "@/lib/new-homes/types";

function card(overrides: Partial<DevelopmentCard>): DevelopmentCard {
  return {
    id: overrides.id ?? Math.random().toString(36),
    slug: "dev",
    name: "Edgbaston Gardens",
    summary: null,
    city: "Birmingham",
    region: "West Midlands",
    postcode: "B15 2LZ",
    priceMin: 320000,
    priceMax: 450000,
    bedsMin: 3,
    bedsMax: 4,
    totalUnits: 14,
    availableUnits: 8,
    schemeType: "houses",
    status: "available",
    completionDate: "2026-09-30",
    helpToBuy: true,
    firstHomes: false,
    sharedOwnership: false,
    heroImageUrl: null,
    developer: { id: "d1", slug: "calthorpe", name: "Calthorpe Homes", logoUrl: null, brandColour: null },
    ...overrides,
  };
}

const developments = [
  card({ id: "1", name: "Edgbaston Gardens", city: "Birmingham" }),
  card({ id: "2", name: "Kirkstall Forge", city: "Leeds", slug: "kirkstall-forge" }),
];

describe("NewHomesBrowser", () => {
  test("renders a card per development with a result count", () => {
    render(<NewHomesBrowser developments={developments} />);
    expect(screen.getByText("Edgbaston Gardens")).toBeInTheDocument();
    expect(screen.getByText("Kirkstall Forge")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("filters instantly as the user types a location", () => {
    render(<NewHomesBrowser developments={developments} />);
    const search = screen.getByPlaceholderText(/search town, postcode/i);
    fireEvent.change(search, { target: { value: "leeds" } });
    expect(screen.getByText("Kirkstall Forge")).toBeInTheDocument();
    expect(screen.queryByText("Edgbaston Gardens")).not.toBeInTheDocument();
  });

  test("shows an empty state and a clear-filters action when nothing matches", () => {
    render(<NewHomesBrowser developments={developments} />);
    const search = screen.getByPlaceholderText(/search town, postcode/i);
    fireEvent.change(search, { target: { value: "nowhere-xyz" } });
    expect(screen.getByText(/no developments match/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear all filters/i }));
    // After clearing, both developments return.
    expect(screen.getByText("Edgbaston Gardens")).toBeInTheDocument();
    expect(screen.getByText("Kirkstall Forge")).toBeInTheDocument();
  });
});
