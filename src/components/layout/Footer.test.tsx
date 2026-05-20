import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

// Mock next/link to render plain <a> tags
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock Logo
vi.mock("@/components/shared/Logo", () => ({
  Logo: () => <span>Britestate</span>,
}));

// Mock CookiePreferencesButton (client island)
vi.mock("@/components/layout/CookiePreferencesButton", () => ({
  CookiePreferencesButton: () => (
    <button type="button">Cookie Preferences</button>
  ),
}));

// Mock BackToTopButton (client island)
vi.mock("@/components/layout/BackToTopButton", () => ({
  BackToTopButton: () => (
    <button type="button">Back to top</button>
  ),
}));

// Mock lucide-react icons (partial mock — navigation.ts imports many icons)
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
  };
});

describe("Footer", () => {
  it("does NOT have 'use client' directive (is a Server Component)", async () => {
    // Use dynamic import with ?raw to read source text
    const mod = await import("./Footer.tsx?raw");
    const source = mod.default as string;
    expect(source).not.toMatch(/^["']use client["']/m);
  });

  it("renders 7 column headings", () => {
    render(<Footer />);
    const headings = screen.getAllByRole("heading");
    // 6 visible heading elements (Brand uses tagline, not a heading)
    // Actually: Properties, Services, Tools, Company, Legal, Popular Areas = 6 headings
    // Brand column does not render a heading — it renders the logo + tagline
    expect(headings.length).toBe(6);
  });

  it("contains expected column headings", () => {
    render(<Footer />);
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.getByText("Popular Areas")).toBeInTheDocument();
  });

  it("has total link count <= 40", () => {
    // Footer link count smell check. Limit raised from 35 -> 40 in 2026-05 as
    // the site grew (per Sprint 1 launch-readiness decision). Treat as a
    // smell signal, not a hard rule.
    const { container } = render(<Footer />);
    const allLinks = container.querySelectorAll("a");
    expect(allLinks.length).toBeLessThanOrEqual(40);
  });

  it("all links have href attributes", () => {
    const { container } = render(<Footer />);
    const allLinks = container.querySelectorAll("a");
    allLinks.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("brand column has tagline text", () => {
    render(<Footer />);
    expect(screen.getByText("The smarter way to find your home.")).toBeInTheDocument();
  });

  it("social links are present with external hrefs", () => {
    const { container } = render(<Footer />);
    const externalLinks = container.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBe(4);
    const hrefs = Array.from(externalLinks).map((el) => el.getAttribute("href"));
    expect(hrefs).toContain("https://twitter.com/britestate");
    expect(hrefs).toContain("https://linkedin.com/company/britestate");
    expect(hrefs).toContain("https://instagram.com/britestate");
    expect(hrefs).toContain("https://facebook.com/britestate");
  });

  it("renders copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/2026 Britestate Ltd/)).toBeInTheDocument();
  });

  it("renders Cookie Preferences button", () => {
    render(<Footer />);
    expect(screen.getByText("Cookie Preferences")).toBeInTheDocument();
  });

  it("renders Back to top button", () => {
    render(<Footer />);
    expect(screen.getByText("Back to top")).toBeInTheDocument();
  });

  it("uses lg:grid-cols-7 layout", () => {
    const { container } = render(<Footer />);
    const grid = container.querySelector(".lg\\:grid-cols-7");
    expect(grid).toBeInTheDocument();
  });
});
