import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardTopbar } from "./DashboardTopbar";

// Mock next/link
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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/homebuyer",
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      email: "test@example.com",
      user_metadata: { display_name: "Test User" },
    },
  }),
}));

// Mock UnreadBadge
vi.mock("@/components/messaging/UnreadBadge", () => ({
  default: () => <span data-testid="unread-badge">0</span>,
}));

// Mock Avatar components
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: { children: React.ReactNode; size?: string }) => (
    <div {...props}>{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("DashboardTopbar", () => {
  it("renders the Britestate wordmark linking to the home page", () => {
    render(<DashboardTopbar />);
    const wordmark = screen.getByRole("link", { name: /britestate/i });
    expect(wordmark).toHaveAttribute("href", "/");
  });

  it("renders a notifications link", () => {
    render(<DashboardTopbar />);
    expect(screen.getByLabelText(/notifications/i)).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  it("renders a messages/inbox link with the unread badge", () => {
    render(<DashboardTopbar />);
    expect(screen.getByLabelText(/messages|inbox/i)).toHaveAttribute("href", "/inbox");
    expect(screen.getByTestId("unread-badge")).toBeInTheDocument();
  });

  it("renders the account link to settings", () => {
    render(<DashboardTopbar />);
    expect(screen.getByLabelText(/account|profile|settings/i)).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
