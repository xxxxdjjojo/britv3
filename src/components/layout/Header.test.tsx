import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

// Mock next/link to render plain <a> tags
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock MegaMenu
vi.mock("@/components/layout/MegaMenu", () => ({
  MegaMenu: () => <nav aria-label="Main navigation">MegaMenu</nav>,
}));

// Mock MobileNav
vi.mock("@/components/layout/MobileNav", () => ({
  MobileNav: () => null,
}));

// Mock Logo
vi.mock("@/components/shared/Logo", () => ({
  Logo: () => <span>Britestate</span>,
}));

// Stub useRole — SavedBadge calls it and would otherwise hit supabase.from()
// on the test client (which only mocks auth.*), triggering an unhandled rejection.
vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({
    roles: [],
    activeRole: null,
    loading: false,
    switchRole: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// Mock Supabase client
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("renders MegaMenu component with aria-label='Main navigation'", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("SearchTrigger button is visible", () => {
    render(<Header />);
    // Should find the command-K badge text
    expect(screen.getByText("K")).toBeInTheDocument();
  });

  it("shows 'Sign In' and 'List Property' when user is null", () => {
    render(<Header />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("List Property")).toBeInTheDocument();
  });

  it("shows avatar when user is provided", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "test@example.com" } },
    });
    // Trigger the auth state change callback with a user
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: { user: { id: string; email: string } } | null) => void) => {
      cb("SIGNED_IN", { user: { id: "1", email: "test@example.com" } });
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(<Header />);

    // Avatar should show the first letter of email
    const avatar = await screen.findByText("T");
    expect(avatar).toBeInTheDocument();
  });

  it("skip-to-content link is present", () => {
    render(<Header />);
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("hamburger button is visible for mobile nav trigger", () => {
    render(<Header />);
    const hamburger = screen.getByRole("button", { name: /open menu/i });
    expect(hamburger).toBeInTheDocument();
  });
});
