import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/fair-housing" }));

import FairHousingPage, { metadata } from "./page";

describe("Fair Housing page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Fair Housing");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/fair-housing");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<FairHousingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Fair Housing Policy/i }),
    ).toBeInTheDocument();
    for (const id of [
      "our-commitment",
      "non-discrimination",
      "accessibility",
      "reporting",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
