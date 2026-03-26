import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: null } })) },
  })),
}));

describe("Homepage hero", () => {
  it("Find Services link points to /services", async () => {
    const { default: HomePage } = await import("./page");
    const element = await HomePage();
    const { container } = render(element);

    const findServicesLink = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent?.trim() === "Find Services"
    );

    expect(findServicesLink).toBeDefined();
    expect(findServicesLink?.getAttribute("href")).toBe("/services");
  });
});
