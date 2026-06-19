/**
 * Render smoke-tests for DepositManagementClient.
 * Verifies the component mounts, shows all key data fields,
 * and renders the table / empty state correctly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, getAllByRole } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DepositManagementClient } from "./DepositManagementClient";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
  );
}

const SERVER_TS = new Date("2024-01-15T12:00:00Z").getTime();

const ACTIVE_TENANCIES = [
  { id: "t1", tenant_name: "Alice Test", property_id: "p1" },
];

const MOCK_DEPOSITS = [
  {
    id: "d1",
    tenancy_id: "t1",
    landlord_id: "11111111-1111-1111-1111-111111111111",
    amount: 1500,
    scheme: "TDS" as const,
    scheme_reference: "TDS-12345",
    registration_date: "2023-06-10",
    prescribed_info_sent_date: "2023-06-12",
    status: "registered" as const,
    notes: "",
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2023-06-12T00:00:00Z",
    tenancy: {
      tenant_name: "Alice Test",
      property_address: "10 Test Street, London",
    },
  },
  {
    id: "d2",
    tenancy_id: "t1",
    landlord_id: "22222222-2222-2222-2222-222222222222",
    amount: 875,
    scheme: "DPS" as const,
    scheme_reference: null,
    registration_date: null,
    prescribed_info_sent_date: null,
    status: "pending" as const,
    notes: null,
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2023-12-01T00:00:00Z",
    tenancy: {
      tenant_name: "Bob Test",
      property_address: "22 Sample Road, Manchester",
    },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DepositManagementClient", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DEPOSITS,
    }) as unknown as typeof fetch;
  });

  it("renders summary stat tiles with correct labels", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={MOCK_DEPOSITS}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    // Use getAllByText for labels that appear in multiple places (stat card + table header)
    expect(screen.getByText("Total Deposits Held")).toBeInTheDocument();
    expect(screen.getAllByText("Registered").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1);
    // Disputed is restored as a primary stat card
    expect(screen.getAllByText("Disputed").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Tenancy Deposits section header with count badge", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={MOCK_DEPOSITS}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    expect(screen.getByText("Tenancy Deposits")).toBeInTheDocument();
    expect(screen.getByText("2 Total")).toBeInTheDocument();
  });

  it("renders deposit rows with tenant name and deposit amount", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={MOCK_DEPOSITS}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    // Use getAllByText since tenant names may appear in both table rows and form dropdowns
    expect(screen.getAllByText("Alice Test").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob Test").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("£1,500")).toBeInTheDocument();
    expect(screen.getByText("£875")).toBeInTheDocument();
  });

  it("shows 'Mark Registered' action only for pending deposits", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={MOCK_DEPOSITS}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    // One "Mark Registered" for the pending deposit
    const markButtons = screen.getAllByRole("button", {
      name: /mark registered/i,
    });
    expect(markButtons).toHaveLength(1);

    // Two "Edit" buttons (one per deposit)
    const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
    expect(editButtons).toHaveLength(2);
  });

  it("renders empty state message when no deposits", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={[]}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    expect(
      screen.getByText("No deposit registrations found."),
    ).toBeInTheDocument();
  });

  it("shows compliance warning banner when a deposit is overdue for registration", () => {
    const overdueTs = new Date("2024-06-01T00:00:00Z").getTime(); // >30 days after created_at
    const oldPending = {
      ...MOCK_DEPOSITS[1],
      status: "pending" as const,
      registration_date: null,
      created_at: "2024-01-01T00:00:00Z", // 5 months before overdueTs
    };

    renderWithQuery(
      <DepositManagementClient
        initialData={[oldPending]}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={overdueTs}
      />,
    );

    expect(
      screen.getByText(/compliance warning/i),
    ).toBeInTheDocument();
  });

  it("renders Filter and Export CSV buttons", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={MOCK_DEPOSITS}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /export csv/i }),
    ).toBeInTheDocument();
  });

  it("renders the Protection Compliance Reminder section", () => {
    renderWithQuery(
      <DepositManagementClient
        initialData={MOCK_DEPOSITS}
        activeTenancies={ACTIVE_TENANCIES}
        serverTimestamp={SERVER_TS}
      />,
    );

    expect(
      screen.getByText("Protection Compliance Reminder"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open support ticket/i }),
    ).toBeInTheDocument();
  });
});
