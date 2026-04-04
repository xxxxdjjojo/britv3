// src/__tests__/responsive/ResponsiveSidebar.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponsiveSidebar } from "@/components/responsive/ResponsiveSidebar";

describe("ResponsiveSidebar", () => {
  it("renders sidebar content in desktop aside", () => {
    render(
      <ResponsiveSidebar>
        <nav>Dashboard Nav</nav>
      </ResponsiveSidebar>,
    );
    expect(screen.getByText("Dashboard Nav")).toBeInTheDocument();
  });

  it("renders with custom className on aside", () => {
    const { container } = render(
      <ResponsiveSidebar className="bg-neutral-900">
        <nav>Nav</nav>
      </ResponsiveSidebar>,
    );
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("bg-neutral-900");
  });

  it("renders hamburger button for mobile", () => {
    render(
      <ResponsiveSidebar>
        <nav>Nav</nav>
      </ResponsiveSidebar>,
    );
    expect(screen.getByRole("button", { name: /open navigation/i })).toBeInTheDocument();
  });
});
