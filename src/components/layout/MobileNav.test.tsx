import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "./MobileNav";
import { savedDashboardPathForRole } from "@/lib/routes";
import type { UserRole } from "@/types/auth";

let mockActiveRole: UserRole | null = null;

// Mock next/link to render plain <a> tags
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ activeRole: mockActiveRole }),
}));

// Mock @base-ui/react/dialog to render simple DOM elements for Sheet
vi.mock("@base-ui/react/dialog", () => {
  const Dialog = {
    Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
      open ? <div data-slot="sheet">{children}</div> : null,
    Trigger: ({ children, ...props }: { children: React.ReactNode }) => (
      <button {...props}>{children}</button>
    ),
    Close: ({ children, render, ...props }: { children?: React.ReactNode; render?: React.ReactElement }) => {
      if (render) {
        return <button {...props}>{children}</button>;
      }
      return <button {...props}>{children}</button>;
    },
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Backdrop: ({ children, ...props }: { children?: React.ReactNode; className?: string }) => (
      <div {...props}>{children}</div>
    ),
    Popup: ({ children, ...props }: { children: React.ReactNode; className?: string }) => (
      <div {...props}>{children}</div>
    ),
    Title: ({ children, ...props }: { children: React.ReactNode; className?: string }) => (
      <h2 {...props}>{children}</h2>
    ),
    Description: ({ children, ...props }: { children: React.ReactNode }) => (
      <p {...props}>{children}</p>
    ),
  };
  return { Dialog };
});

describe("MobileNav", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    mockActiveRole = null;
  });

  it("renders when open=true", () => {
    render(<MobileNav {...defaultProps} />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("does not render when open=false", () => {
    render(<MobileNav open={false} onOpenChange={vi.fn()} />);
    const nav = screen.queryByRole("navigation", { name: "Mobile navigation" });
    expect(nav).not.toBeInTheDocument();
  });

  it("has 6 accordion sections matching NAV_ITEMS count", () => {
    render(<MobileNav {...defaultProps} />);
    // Each accordion trigger has data-testid="accordion-trigger-N"
    const triggers = [0, 1, 2, 3, 4, 5].map((i) =>
      screen.getByTestId(`accordion-trigger-${i}`),
    );
    expect(triggers).toHaveLength(6);
  });

  it("all links are rendered as <a> tags in DOM at mount (not lazy-loaded)", () => {
    render(<MobileNav {...defaultProps} />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const links = nav.querySelectorAll("a");
    // NAV_ITEMS have many links across all sections — they should all be in the DOM
    expect(links.length).toBeGreaterThan(20);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("links use text-base class (via navLinkClasses mobile variant)", () => {
    render(<MobileNav {...defaultProps} />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const links = nav.querySelectorAll("a");
    // At least some links should have text-base (from navLinkClasses mobile variant)
    const hasTextBase = Array.from(links).some((link) =>
      link.className.includes("text-base"),
    );
    expect(hasTextBase).toBe(true);
  });

  it("quick-access icons present (saved, notifications, messages links)", () => {
    render(<MobileNav {...defaultProps} />);
    const savedLink = screen.getByRole("link", { name: /saved/i });
    const notificationsLink = screen.getByRole("link", { name: /notification/i });
    const messagesLink = screen.getByRole("link", { name: /message/i });

    expect(savedLink).toHaveAttribute("href", "/dashboard");
    expect(notificationsLink).toHaveAttribute("href", "/notifications");
    expect(messagesLink).toHaveAttribute("href", "/inbox");
  });

  it.each([
    "homebuyer",
    "renter",
    "seller",
    "landlord",
    "agent",
    "service_provider",
    "mortgage_broker",
  ] as UserRole[])("saved quick link targets the valid %s saved destination", (role) => {
    mockActiveRole = role;
    render(<MobileNav {...defaultProps} />);

    expect(screen.getByRole("link", { name: /^saved$/i })).toHaveAttribute(
      "href",
      savedDashboardPathForRole(role),
    );
  });

  it("auth buttons present (Sign In and Get Started)", () => {
    render(<MobileNav {...defaultProps} />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  it("accordion triggers show nav item labels", () => {
    render(<MobileNav {...defaultProps} />);
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Tools & Valuations")).toBeInTheDocument();
    expect(screen.getByText("Advice")).toBeInTheDocument();
    expect(screen.getByText("List / Sell")).toBeInTheDocument();
  });

  it("clicking accordion trigger expands that section", () => {
    render(<MobileNav {...defaultProps} />);
    const buyTrigger = screen.getByTestId("accordion-trigger-0");

    // Click to expand
    fireEvent.click(buyTrigger);

    // Buy section headings should be visible
    const panel = screen.getByTestId("accordion-panel-0");
    expect(panel).toBeInTheDocument();
    expect(panel.textContent).toContain("Property Search");
  });

  it("only one accordion section open at a time (exclusive mode)", () => {
    render(<MobileNav {...defaultProps} />);

    // Open Buy
    fireEvent.click(screen.getByTestId("accordion-trigger-0"));
    expect(screen.getByTestId("accordion-panel-0")).toBeInTheDocument();

    // Open Rent — Buy should close
    fireEvent.click(screen.getByTestId("accordion-trigger-1"));
    const buyPanel = screen.queryByTestId("accordion-panel-0");
    // Buy panel should be hidden (height: 0 or not rendered)
    expect(buyPanel?.getAttribute("data-open")).not.toBe("true");
    expect(screen.getByTestId("accordion-panel-1").getAttribute("data-open")).toBe("true");
  });
});
