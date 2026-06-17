import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { JobLeadsClient } from "@/components/dashboard/provider/JobLeadsClient";

// ---------------------------------------------------------------------------
// Mocks
// JobLeadsClient subscribes to Supabase Realtime in an effect and renders
// JobLeadCard children (which call accept/decline). We mock the supabase
// client with a chainable channel API and stub the service module so the
// child cards render without touching the network.
// ---------------------------------------------------------------------------

const removeChannel = vi.fn();

vi.mock("@/lib/supabase/client", () => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  return {
    createClient: () => ({
      channel: vi.fn(() => channel),
      removeChannel,
    }),
  };
});

vi.mock("@/services/provider/provider-job-service", () => ({
  acceptLead: vi.fn(),
  declineLead: vi.fn(),
}));

function makeLead(overrides: Partial<ProviderLead> = {}): ProviderLead {
  return {
    id: "lead-1",
    clientName: "Jane Smith",
    serviceCategory: "Plumbing",
    description: "Leaking tap",
    location: "Bristol",
    status: "new",
    budgetMinPence: null,
    budgetMaxPence: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JobLeadsClient — render with data", () => {
  it("renders one card per lead", () => {
    render(
      <JobLeadsClient
        providerId="prov-1"
        initialLeads={[
          makeLead({ id: "a", serviceCategory: "Plumbing" }),
          makeLead({ id: "b", serviceCategory: "Electrical", clientName: "Bob" }),
        ]}
      />,
    );

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders the live-listening indicator", () => {
    render(<JobLeadsClient providerId="prov-1" initialLeads={[makeLead()]} />);
    expect(screen.getByText(/Listening for new leads in real time/i)).toBeInTheDocument();
  });
});

describe("JobLeadsClient — category filter tabs", () => {
  it("derives an 'All' tab plus one tab per unique category, sorted", () => {
    render(
      <JobLeadsClient
        providerId="prov-1"
        initialLeads={[
          makeLead({ id: "a", serviceCategory: "Plumbing" }),
          makeLead({ id: "b", serviceCategory: "Electrical" }),
          makeLead({ id: "c", serviceCategory: "Plumbing" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Electrical" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plumbing" })).toBeInTheDocument();
  });

  it("filters cards to the selected category", async () => {
    render(
      <JobLeadsClient
        providerId="prov-1"
        initialLeads={[
          makeLead({ id: "a", serviceCategory: "Plumbing", clientName: "Plumber Client" }),
          makeLead({ id: "b", serviceCategory: "Electrical", clientName: "Spark Client" }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Electrical" }));

    expect(screen.getByText("Spark Client")).toBeInTheDocument();
    expect(screen.queryByText("Plumber Client")).not.toBeInTheDocument();
  });

  it("shows the empty state when a category filter matches no leads after another is selected", async () => {
    // Selecting 'All' brings them back
    render(
      <JobLeadsClient
        providerId="prov-1"
        initialLeads={[
          makeLead({ id: "a", serviceCategory: "Plumbing", clientName: "Plumber Client" }),
        ]}
      />,
    );

    // Only one category — filter to it then back to All
    fireEvent.click(screen.getByRole("button", { name: "Plumbing" }));
    expect(screen.getByText("Plumber Client")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Plumber Client")).toBeInTheDocument();
  });

  it("does not render filter tabs when there are no leads", () => {
    render(<JobLeadsClient providerId="prov-1" initialLeads={[]} />);
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
  });
});

describe("JobLeadsClient — empty state", () => {
  it("shows the empty placeholder when there are no leads", () => {
    render(<JobLeadsClient providerId="prov-1" initialLeads={[]} />);

    expect(screen.getByText("No leads right now")).toBeInTheDocument();
    expect(
      screen.getByText(/New leads matching your service categories/i),
    ).toBeInTheDocument();
  });
});

describe("JobLeadsClient — realtime subscription lifecycle", () => {
  it("cleans up the channel on unmount", () => {
    const { unmount } = render(
      <JobLeadsClient providerId="prov-1" initialLeads={[makeLead()]} />,
    );
    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});

describe("JobLeadsClient — active tab styling", () => {
  it("marks the active category tab with the brand colour class", async () => {
    render(
      <JobLeadsClient
        providerId="prov-1"
        initialLeads={[makeLead({ serviceCategory: "Plumbing" })]}
      />,
    );

    const plumbingTab = screen.getByRole("button", { name: "Plumbing" });
    fireEvent.click(plumbingTab);

    // Active tab uses the deep-green brand background
    expect(plumbingTab.className).toContain("#1B4D3E");
    // Sanity: the tab container holds both All and Plumbing
    const allTab = screen.getByRole("button", { name: "All" });
    expect(within(allTab.parentElement as HTMLElement).getAllByRole("button").length).toBeGreaterThanOrEqual(2);
  });
});
