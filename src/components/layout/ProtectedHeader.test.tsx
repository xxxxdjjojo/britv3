import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProtectedHeader } from "./ProtectedHeader";

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

// Mock responsive + scroll hooks (auto-hide logic)
vi.mock("@/hooks/useScrollDirection", () => ({
  useScrollDirection: () => "up",
}));
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false, isTablet: false }),
}));

// Mock useAuth (for avatar initials)
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      email: "test@example.com",
      user_metadata: { display_name: "Test User" },
    },
  }),
}));

// Mock NotificationBell + UnreadBadge
vi.mock("@/components/notifications/NotificationBell", () => ({
  default: () => (
    <a href="/notifications" aria-label="Notifications">
      bell
    </a>
  ),
}));
vi.mock("@/components/messaging/UnreadBadge", () => ({
  default: () => <span data-testid="unread-badge">0</span>,
}));

// Mock Avatar
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: { children: React.ReactNode; size?: string }) => (
    <div {...props}>{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("ProtectedHeader", () => {
  it("renders the brand logo linking to the home page", () => {
    render(<ProtectedHeader />);
    const home = screen.getAllByRole("link").find((a) => a.getAttribute("href") === "/");
    expect(home).toBeDefined();
  });

  it("renders the inbox link with unread badge", () => {
    render(<ProtectedHeader />);
    expect(screen.getByLabelText("Inbox")).toHaveAttribute("href", "/inbox");
    expect(screen.getByTestId("unread-badge")).toBeInTheDocument();
  });

  it("renders the account avatar link to settings", () => {
    render(<ProtectedHeader />);
    expect(screen.getByLabelText(/account|profile|settings/i)).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
