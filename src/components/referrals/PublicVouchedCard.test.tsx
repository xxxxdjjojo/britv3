import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicVouchedCard } from "./PublicVouchedCard";

describe("PublicVouchedCard", () => {
  it("renders the consent-safe 3+3 proof with accessible attribution", () => {
    render(<PublicVouchedCard profile={{
      businessName: "North Star Plumbing",
      slug: "north-star",
      attributions: [
        { firstName: "Alex", role: "Electrician", acceptedAt: "2026-07-14T10:00:00.000Z" },
        { firstName: "Sam", role: "Client", acceptedAt: "2026-07-15T10:00:00.000Z" },
      ],
    }} />);

    expect(screen.getByRole("heading", { name: "North Star Plumbing" })).toBeInTheDocument();
    expect(screen.getByText("TrueDeed 3+3 vouched")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Consented vouches" })).toBeInTheDocument();
    expect(screen.getByText("Electrician")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getAllByText(/accepted/i)).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/email|phone|evidence|fraud|uuid/i);
  });
});
