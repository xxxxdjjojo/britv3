import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SavedBadge } from "./SavedBadge";
import { dashboardPathForRole, ROUTES } from "@/lib/routes";
import type { UserRole } from "@/types/auth";

let mockActiveRole: UserRole | null = null;

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ activeRole: mockActiveRole }),
}));

describe("SavedBadge", () => {
  beforeEach(() => {
    mockActiveRole = null;
  });

  it("falls back to the dashboard root when there is no active role", () => {
    render(<SavedBadge />);

    expect(
      screen.getByRole("link", { name: /saved properties/i }),
    ).toHaveAttribute("href", ROUTES.dashboard.root);
  });

  it.each([
    "homebuyer",
    "renter",
    "seller",
    "landlord",
    "agent",
    "service_provider",
    "mortgage_broker",
  ] as UserRole[])("links %s users to their saved dashboard route", (role) => {
    mockActiveRole = role;
    render(<SavedBadge />);

    expect(
      screen.getByRole("link", { name: /saved properties/i }),
    ).toHaveAttribute("href", dashboardPathForRole(role, "saved"));
  });
});
