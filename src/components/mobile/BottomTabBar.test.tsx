import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomTabBar } from "./BottomTabBar";
import { TAB_CONFIG } from "@/config/navigation";
import { USER_ROLES, type UserRole } from "@/types/auth";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockActiveRole: UserRole | null = "homebuyer";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ activeRole: mockActiveRole }),
}));

vi.mock("@/hooks/useVirtualKeyboard", () => ({
  useVirtualKeyboard: () => false,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BottomTabBar", () => {
  beforeEach(() => {
    mockActiveRole = "homebuyer";
  });

  it("has aria-label for navigation", () => {
    render(<BottomTabBar />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("tab items have min-h-12 class (48px touch target)", () => {
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.className).toContain("min-h-12");
    }
  });

  it("mortgage_broker role has 5 tabs", () => {
    mockActiveRole = "mortgage_broker";
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  // Enumerate from USER_ROLES (the type's single source of truth), NOT a
  // hand-maintained list — the previous hard-coded 7-role list silently
  // omitted "developer", which is exactly how the missing-config bug shipped.
  it("every UserRole has a tab configuration", () => {
    for (const role of USER_ROLES) {
      expect(TAB_CONFIG[role]).toBeDefined();
      expect(TAB_CONFIG[role].length).toBeGreaterThanOrEqual(4);
    }
  });

  // Regression guard: a role the tab map doesn't know must hide the bar, never
  // throw `TAB_CONFIG[role].map(...)` and white-screen the dashboard.
  it("returns null instead of crashing for a role absent from TAB_CONFIG", () => {
    mockActiveRole = "role_the_frontend_has_never_heard_of" as UserRole;
    let container: HTMLElement | undefined;
    expect(() => {
      container = render(<BottomTabBar />).container;
    }).not.toThrow();
    expect(container?.innerHTML).toBe("");
  });

  it("imports TAB_CONFIG from navigation config (no inline definition)", () => {
    // Verify TAB_CONFIG is exported from the config module
    expect(TAB_CONFIG).toBeDefined();
    expect(typeof TAB_CONFIG).toBe("object");
    // Verify the component renders tabs matching the config
    mockActiveRole = "homebuyer";
    render(<BottomTabBar />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(TAB_CONFIG.homebuyer.length);
  });

  it("renders Messages tab with badge container", () => {
    render(<BottomTabBar />);
    const messagesLink = screen.getByText("Messages").closest("a");
    expect(messagesLink).toBeInTheDocument();
    // Badge dot should exist but be hidden by default
    const badge = messagesLink?.querySelector("[data-badge='messages']");
    expect(badge).toBeInTheDocument();
  });

  it.each(USER_ROLES)("renders every configured bottom tab for %s", (role) => {
    mockActiveRole = role;
    render(<BottomTabBar />);

    for (const tab of TAB_CONFIG[role]) {
      const link = screen.getByText(tab.label).closest("a");

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", tab.href);
    }
  });

  it("returns null when no active role", () => {
    mockActiveRole = null;
    const { container } = render(<BottomTabBar />);
    expect(container.innerHTML).toBe("");
  });
});
