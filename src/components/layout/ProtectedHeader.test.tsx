import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";

const { signOut, mockUser } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  mockUser: {
    current: {
      email: "test@example.com",
      user_metadata: { display_name: "Test User" },
    } as {
      email: string;
      user_metadata: { display_name: string };
    } | null,
  },
}));

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

// Mock useAuth (avatar initials + signOut)
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser.current,
    signOut,
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

import { ProtectedHeader } from "./ProtectedHeader";

// NOTE: the real `dropdown-menu` (Base UI) is intentionally NOT mocked here.
// A previous version mocked it and masked a runtime crash
// ("MenuGroupRootContext is missing") caused by a DropdownMenuLabel placed
// outside a DropdownMenuGroup — the menu never opened in the browser even
// though mocked tests passed. Rendering the real primitive guards against that.

describe("ProtectedHeader", () => {
  beforeEach(() => {
    signOut.mockClear();
    mockUser.current = {
      email: "test@example.com",
      user_metadata: { display_name: "Test User" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: { is_admin: false, admin_role: null },
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("opens the profile menu on click and shows Profile, Settings, Help links", () => {
    render(<ProtectedHeader />);
    fireEvent.click(screen.getByRole("button", { name: /open profile menu/i }));

    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: /profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(within(menu).getByRole("menuitem", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(within(menu).getByRole("menuitem", { name: /help/i })).toHaveAttribute(
      "href",
      "/help",
    );
  });

  it("shows an Admin Console link when the profile has configured admin access", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { is_admin: true, admin_role: "super_admin" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProtectedHeader />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/profile", { cache: "no-store" });
    });
    fireEvent.click(screen.getByRole("button", { name: /open profile menu/i }));

    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: /admin console/i }),
    ).toHaveAttribute("href", "/admin");
  });

  // Regression guard for the real-browser failure: a desktop click is ALWAYS
  // preceded by the pointer entering the target. The previous implementation
  // opened the menu on `mouseenter` (custom hover state) and then Base UI's
  // trigger-press toggled it straight back shut — so clicking the avatar never
  // opened anything. A bare `fireEvent.click` (no preceding enter) hid the bug.
  // The menu MUST be open after the enter→click sequence.
  it("opens the menu when the avatar is pointed at and then clicked (real pointer order)", () => {
    render(<ProtectedHeader />);
    const trigger = screen.getByRole("button", { name: /open profile menu/i });

    fireEvent.mouseEnter(trigger);
    fireEvent.click(trigger);

    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: /profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(within(menu).getByRole("menuitem", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(within(menu).getByRole("menuitem", { name: /help/i })).toHaveAttribute(
      "href",
      "/help",
    );
    expect(within(menu).getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();
  });

  // Keyboard users must be able to open the menu too (ARIA menu-button pattern).
  // ArrowDown opens the menu and moves focus to the first item; Base UI handles
  // this via an explicit keydown handler (true Enter->click is covered by the
  // browser E2E because jsdom does not synthesise native button activation).
  it("opens the menu via the keyboard (ArrowDown on the focused trigger)", () => {
    render(<ProtectedHeader />);
    const trigger = screen.getByRole("button", { name: /open profile menu/i });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });

    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: /profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("logs the user out when Log out is clicked", () => {
    render(<ProtectedHeader />);
    fireEvent.click(screen.getByRole("button", { name: /open profile menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /log out/i }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
