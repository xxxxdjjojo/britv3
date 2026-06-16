import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/refunds" }));

import RefundsPage, { metadata } from "./page";

describe("Refunds page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Refund");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/refunds");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<RefundsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Refund (&|and) Cancellation/i }),
    ).toBeInTheDocument();
    for (const id of ["scope", "cooling-off", "non-refundable", "how-to-request", "timescales"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
