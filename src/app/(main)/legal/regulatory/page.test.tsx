import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/regulatory" }));

import RegulatoryPage, { metadata } from "./page";

describe("Regulatory Information page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Regulatory");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/regulatory");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<RegulatoryPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Regulatory (&|and) Compliance/i }),
    ).toBeInTheDocument();
    for (const id of ["company", "bodies", "aml", "complaints"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
