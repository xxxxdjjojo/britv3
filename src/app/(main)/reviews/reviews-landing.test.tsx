import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("/reviews landing page", () => {
  it("renders a heading with 'Reviews'", async () => {
    const { default: ReviewsPage } = await import("./page");
    const element = await ReviewsPage();
    render(element);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/reviews/i);
  });

  it("contains links to area-based review pages", async () => {
    const { default: ReviewsPage } = await import("./page");
    const element = await ReviewsPage();
    const { container } = render(element);
    const links = Array.from(container.querySelectorAll("a"));
    const areaLinks = links.filter((a) => a.getAttribute("href")?.startsWith("/reviews/"));
    expect(areaLinks.length).toBeGreaterThanOrEqual(5);
  });
});
