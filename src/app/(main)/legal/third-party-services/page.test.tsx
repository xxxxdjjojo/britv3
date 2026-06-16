import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/third-party-services" }));

import ThirdPartyPage, { metadata } from "./page";

describe("Third-Party Services Disclosure page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Third-Party");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/third-party-services");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1, processor list, and every TOC section anchor", () => {
    render(<ThirdPartyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Third-Party Services Disclosure/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    for (const id of ["overview", "processors", "vetting", "related"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
