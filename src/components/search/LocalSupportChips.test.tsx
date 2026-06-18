import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocalSupportChips } from "./LocalSupportChips";

describe("LocalSupportChips", () => {
  it("renders a chip for each default trade category", () => {
    render(<LocalSupportChips />);
    expect(screen.getByRole("link", { name: /plumber/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /electrician/i })).toBeInTheDocument();
  });

  it("points every chip at the working marketplace directory with a category query", () => {
    render(<LocalSupportChips />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/marketplace\?category=/);
    }
  });

  it("uses real service_category enum slugs (plumber, electrician)", () => {
    render(<LocalSupportChips />);
    const plumber = screen.getByRole("link", { name: /plumber/i });
    const electrician = screen.getByRole("link", { name: /electrician/i });
    expect(plumber.getAttribute("href")).toContain("category=plumber");
    expect(electrician.getAttribute("href")).toContain("category=electrician");
  });

  it("never renders a dead '#' or empty href", () => {
    render(<LocalSupportChips postcode="OX1 1AA" />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href");
      expect(href).not.toBe("#");
      expect(href).not.toBe("");
      expect(href).not.toBeNull();
    }
  });

  it("appends the listing postcode when provided", () => {
    render(<LocalSupportChips postcode="OX1 1AA" />);
    const plumber = screen.getByRole("link", { name: /plumber/i });
    const href = plumber.getAttribute("href") ?? "";
    expect(href).toContain("category=plumber");
    // postcode is URL-encoded into the query
    expect(href).toContain("postcode=OX1");
  });

  it("respects a custom category list while keeping real slugs", () => {
    render(<LocalSupportChips categories={["builder", "architect"]} />);
    expect(screen.getByRole("link", { name: /builder/i }).getAttribute("href")).toContain(
      "category=builder",
    );
    expect(
      screen.getByRole("link", { name: /architect/i }).getAttribute("href"),
    ).toContain("category=architect");
    // Default chips are replaced, not appended
    expect(screen.queryByRole("link", { name: /plumber/i })).not.toBeInTheDocument();
  });
});
