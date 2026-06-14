import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OffersPage from "./page";

describe("OffersPage", () => {
  it("renders the Offers & Negotiations heading", () => {
    render(<OffersPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /offers & negotiations/i }),
    ).toBeInTheDocument();
  });

  it("renders the primary submit action and the formal offer panel", () => {
    render(<OffersPage />);
    expect(
      screen.getByRole("button", { name: /submit new offer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /submit formal offer/i }),
    ).toBeInTheDocument();
  });

  it("renders the Active Proposals table with offer rows", () => {
    render(<OffersPage />);
    expect(
      screen.getByRole("heading", { name: /active proposals/i }),
    ).toBeInTheDocument();
    // Appears in both the proposals table and the form's property select.
    expect(
      screen.getAllByText("14 Maple Avenue, Bristol, BS1 4JQ").length,
    ).toBeGreaterThan(0);
    // Status pill text for the rejected offer.
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("renders the Negotiation Timeline steps", () => {
    render(<OffersPage />);
    expect(screen.getByText(/offer received/i)).toBeInTheDocument();
    expect(screen.getByText(/agent reviewing/i)).toBeInTheDocument();
    expect(screen.getByText(/vendor considering/i)).toBeInTheDocument();
  });
});
