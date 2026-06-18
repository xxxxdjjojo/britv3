import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/professional-standards" }));

import ProfessionalStandardsPage, { metadata } from "./page";

describe("Professional Standards page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Professional Standards");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/professional-standards");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<ProfessionalStandardsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Professional Standards/i }),
    ).toBeInTheDocument();
    for (const id of ["code-of-conduct", "ethics", "technical", "verification"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
