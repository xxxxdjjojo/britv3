import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "./Breadcrumbs";

// Mock next/link to render plain <a> tags
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
  };
});

describe("Breadcrumbs", () => {
  it("does NOT have 'use client' directive (is a Server Component)", async () => {
    const mod = await import("./Breadcrumbs.tsx?raw");
    const source = mod.default as string;
    expect(source).not.toMatch(/^["']use client["']/m);
  });

  it("returns null for '/' (homepage)", () => {
    const { container } = render(<Breadcrumbs pathname="/" />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null for '/dashboard/homebuyer' (authenticated route)", () => {
    const { container } = render(<Breadcrumbs pathname="/dashboard/homebuyer" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders 'Home' + 'Buy Property' for '/search?type=buy'", () => {
    render(<Breadcrumbs pathname="/search?type=buy" />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Buy Property")).toBeInTheDocument();
    // Home should be a link
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
    // Buy Property is the current page (no link)
    const buyProperty = screen.getByText("Buy Property");
    expect(buyProperty.tagName).not.toBe("A");
    expect(buyProperty.closest("a")).toBeNull();
  });

  it("renders 'Home' + 'Tools' + 'Stamp Duty Calculator' for '/tools/stamp-duty-calculator'", () => {
    render(<Breadcrumbs pathname="/tools/stamp-duty-calculator" />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Stamp Duty Calculator")).toBeInTheDocument();
  });

  it("fallback: renders 'Home' + 'Unknown' for '/unknown' (capitalizes path segment)", () => {
    render(<Breadcrumbs pathname="/unknown" />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("JSON-LD script tag is present in rendered output", () => {
    const { container } = render(<Breadcrumbs pathname="/about" />);
    const script = container.querySelector("script[type='application/ld+json']");
    expect(script).not.toBeNull();
  });

  it("JSON-LD contains '@type': 'BreadcrumbList'", () => {
    const { container } = render(<Breadcrumbs pathname="/about" />);
    const script = container.querySelector("script[type='application/ld+json']");
    expect(script).not.toBeNull();
    const json = JSON.parse(script!.textContent!);
    expect(json["@type"]).toBe("BreadcrumbList");
    expect(json["@context"]).toBe("https://schema.org");
    expect(json.itemListElement).toBeInstanceOf(Array);
    expect(json.itemListElement.length).toBeGreaterThan(0);
    expect(json.itemListElement[0].name).toBe("Home");
  });

  it("last item in JSON-LD has no 'item' URL (current page)", () => {
    const { container } = render(<Breadcrumbs pathname="/about" />);
    const script = container.querySelector("script[type='application/ld+json']");
    const json = JSON.parse(script!.textContent!);
    const lastItem = json.itemListElement[json.itemListElement.length - 1];
    expect(lastItem.name).toBe("About");
    // Last item should not have an "item" URL since it's the current page
    expect(lastItem.item).toBeUndefined();
  });
});
