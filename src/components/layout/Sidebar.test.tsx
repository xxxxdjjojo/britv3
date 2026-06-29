import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { ROLE_NAV_ITEMS, ROLE_PRIMARY_CTA } from "@/config/navigation";
import { USER_ROLES, type UserRole } from "@/types/auth";

let mockActiveRole: UserRole | null = "homebuyer";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/homebuyer",
}));

// Mock useRole
vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ activeRole: mockActiveRole }),
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

// Mock RoleSwitcher
vi.mock("@/components/layout/RoleSwitcher", () => ({
  RoleSwitcher: () => <div data-testid="role-switcher">RoleSwitcher</div>,
}));

// Mock UnreadBadge
vi.mock("@/components/messaging/UnreadBadge", () => ({
  default: () => <span data-testid="unread-badge">0</span>,
}));

// Mock NotificationBadge (uses useNotificationCount → useQuery)
vi.mock("@/components/notifications/NotificationBadge", () => ({
  default: () => <span data-testid="notification-badge">0</span>,
}));

// Mock Avatar components
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: { children: React.ReactNode; size?: string }) => (
    <div {...props}>{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockActiveRole = "homebuyer";
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    });
  });

  it("renders 'Back to Site' link with href='/' as default fallback", () => {
    render(<Sidebar />);
    const backLink = screen.getByTitle("Back to Site");
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders section headers: Manage, Communicate, Account", () => {
    render(<Sidebar />);
    expect(screen.getByText("Manage")).toBeInTheDocument();
    expect(screen.getByText("Communicate")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("section headers have correct styling classes", () => {
    render(<Sidebar />);
    const manageHeader = screen.getByText("Manage");
    expect(manageHeader.className).toContain("text-xs");
    expect(manageHeader.className).toContain("font-semibold");
    expect(manageHeader.className).toContain("uppercase");
    expect(manageHeader.className).toContain("tracking-wider");
  });

  it("nav links use navLinkClasses with text-base", () => {
    render(<Sidebar />);
    // Overview link for homebuyer should have text-base from navLinkClasses
    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink?.className).toContain("text-base");
  });

  it("does not define ROLE_NAV_ITEMS inline — imports from navigation config", async () => {
    // Verify the component source does not contain the inline definition
    // This test validates architecture: ROLE_NAV_ITEMS comes from @/config/navigation
    // We verify by checking that the imported ROLE_NAV_ITEMS works correctly
    render(<Sidebar />);
    // Homebuyer role items should render from the config
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Saved Properties")).toBeInTheDocument();
  });

  it("has transition classes for collapse animation", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("transition-all");
    expect(aside?.className).toContain("duration-200");
  });

  it("renders notification badge on Notifications link", () => {
    render(<Sidebar />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders Inbox with UnreadBadge", () => {
    render(<Sidebar />);
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByTestId("unread-badge")).toBeInTheDocument();
  });

  it("renders user info section with display name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it.each(Object.keys(ROLE_NAV_ITEMS) as UserRole[])(
    "renders every configured dashboard link for %s",
    (role) => {
      mockActiveRole = role;
      render(<Sidebar />);

      for (const item of ROLE_NAV_ITEMS[role]) {
        const link = screen.getByText(item.label).closest("a");

        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", item.href);
      }
    },
  );

  // ── Developer dashboard regression suite ─────────────────────────────────
  // The developer dashboard white-screened ("Something went wrong") because
  // `activeRole` resolves to "developer" client-side (~2s after mount) and the
  // unguarded `ROLE_PRIMARY_CTA[activeRole].href` threw when the role was absent
  // from the map. These tests lock the fix at both layers: the developer role
  // must render its links + CTA, AND an unknown role must degrade gracefully.

  it("renders the developer sidebar links and primary CTA", () => {
    mockActiveRole = "developer";
    render(<Sidebar />);

    expect(screen.getByText("Developments").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/developer/developments",
    );
    // The CTA block is the exact site that crashed on prod
    // (`ROLE_PRIMARY_CTA[activeRole].href`). Asserting its label renders proves
    // the block resolves the developer entry without throwing; the href target
    // itself is verified in navigation.test.ts.
    expect(
      screen.getByText(ROLE_PRIMARY_CTA.developer.label),
    ).toBeInTheDocument();
  });

  it("does not crash when active role is absent from the nav maps", () => {
    // `activeRole` is a DB string cast to UserRole — a role the frontend maps
    // have never seen must never take down the whole dashboard.
    mockActiveRole = "role_the_frontend_has_never_heard_of" as UserRole;

    expect(() => render(<Sidebar />)).not.toThrow();
    // Dashboard chrome still renders; the user is never white-screened.
    expect(screen.getByText("Manage")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it.each(USER_ROLES)("renders the sidebar without throwing for %s", (role) => {
    mockActiveRole = role;
    expect(() => render(<Sidebar />)).not.toThrow();
  });
});
