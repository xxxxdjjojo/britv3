import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomTabBar } from "./BottomTabBar";
import { TAB_CONFIG } from "@/config/navigation";
import type { UserRole } from "@/types/auth";

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

  it("all 7 roles have tab configurations", () => {
    const roles: UserRole[] = [
      "homebuyer",
      "renter",
      "seller",
      "landlord",
      "agent",
      "service_provider",
      "mortgage_broker",
    ];
    for (const role of roles) {
      expect(TAB_CONFIG[role]).toBeDefined();
      expect(TAB_CONFIG[role].length).toBeGreaterThanOrEqual(4);
    }
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

  it.each([
    "homebuyer",
    "renter",
    "seller",
    "landlord",
    "agent",
    "service_provider",
    "mortgage_broker",
  ] as UserRole[])("renders every configured bottom tab for %s", (role) => {
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
