// src/__tests__/landlord/tenant-screening-client.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, getAllByRole, fireEvent } from "@testing-library/react";
import { TenantScreeningClient } from "@/components/landlord/TenantScreeningClient";
import type { TenantApplication } from "@/types/landlord";

// -- Module mocks -------------------------------------------------------------

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => ({})) }));

// InsightPanel uses next/link (already mocked above) and Button; render it real
// ApplicationPipelineCard is not used in the table view; no mock needed

// -- Fixtures -----------------------------------------------------------------

const makeApp = (overrides: Partial<TenantApplication> = {}): TenantApplication => ({
  id: "app-1",
  property_id: "prop-1",
  landlord_id: "landlord-1",
  applicant_user_id: null,
  applicant_name: "Alice Sharma",
  applicant_email: "alice@example.com",
  status: "received",
  monthly_income: 3000,
  employment_status: "Employed (full-time)",
  credit_check_status: "not_run",
  references_status: "pending",
  notes: null,
  rejection_reason: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

// -- Tests --------------------------------------------------------------------

describe("TenantScreeningClient", () => {
  it("renders the page heading", () => {
    render(<TenantScreeningClient initialApplications={[]} />);
    expect(screen.getByRole("heading", { name: /tenant screening/i })).toBeInTheDocument();
  });

  it("renders an applicant row with name and email", () => {
    const apps = [makeApp()];
    render(<TenantScreeningClient initialApplications={apps} />);
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("renders a row for each application", () => {
    const apps = [
      makeApp({ id: "app-1", applicant_name: "Alice Sharma", applicant_email: "alice@example.com" }),
      makeApp({ id: "app-2", applicant_name: "Bob Jones", applicant_email: "bob@example.com" }),
    ];
    render(<TenantScreeningClient initialApplications={apps} />);
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows empty state when no applications", () => {
    render(<TenantScreeningClient initialApplications={[]} />);
    expect(screen.getByText(/no applications/i)).toBeInTheDocument();
  });

  it("renders stat chips with correct total count", () => {
    const apps = [makeApp({ id: "app-1" }), makeApp({ id: "app-2", status: "approved" })];
    render(<TenantScreeningClient initialApplications={apps} />);
    // The "Total Applications" chip should show 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders the approved count in the header summary", () => {
    const apps = [
      makeApp({ id: "app-1", status: "approved" }),
      makeApp({ id: "app-2", status: "received" }),
    ];
    render(<TenantScreeningClient initialApplications={apps} />);
    expect(screen.getByText(/1 approved/i)).toBeInTheDocument();
  });

  it("renders Review links for each row", () => {
    const apps = [
      makeApp({ id: "app-abc", applicant_name: "Alice Sharma" }),
    ];
    render(<TenantScreeningClient initialApplications={apps} />);
    const reviewLinks = screen.getAllByRole("link", { name: /review/i });
    // At least one Review link pointing to the correct route
    expect(reviewLinks.some((l) => l.getAttribute("href") === "/dashboard/landlord/tenants/app-abc")).toBe(true);
  });

  it("reflects applications from props when they change (the list is not frozen)", () => {
    const { rerender } = render(
      <TenantScreeningClient initialApplications={[makeApp({ id: "app-1", applicant_name: "Alice Sharma" })]} />,
    );
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();

    // router.refresh() re-renders the server component with fresh props; the
    // client must reflect them (the original useState froze the first value).
    rerender(
      <TenantScreeningClient
        initialApplications={[
          makeApp({ id: "app-1", applicant_name: "Alice Sharma" }),
          makeApp({ id: "app-2", applicant_name: "Bob Jones" }),
        ]}
      />,
    );
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  function openAddApplicationSheet() {
    // The trigger is the first "Add Application" button (the submit button in the
    // opened sheet carries the same label).
    fireEvent.click(getAllByRole(document.body, "button", { name: /add application/i })[0]);
  }

  it("guides the landlord to add a property first when they have none", async () => {
    render(<TenantScreeningClient initialApplications={[]} properties={[]} />);
    openAddApplicationSheet();
    expect(await screen.findByText(/add a property first/i)).toBeInTheDocument();
    expect(screen.queryByText(/which property/i)).not.toBeInTheDocument();
  });

  it("offers a property field in the add form when properties exist", async () => {
    render(
      <TenantScreeningClient
        initialApplications={[]}
        properties={[{ id: "prop-1", address_line_1: "24 Maple Gardens", city: "London" }]}
      />,
    );
    openAddApplicationSheet();
    expect(await screen.findByText(/which property/i)).toBeInTheDocument();
    expect(screen.queryByText(/add a property first/i)).not.toBeInTheDocument();
  });
});
