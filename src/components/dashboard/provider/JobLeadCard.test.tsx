/**
 * Design-parity render tests for JobLeadCard and JobLeadsClient.
 * Verifies heading text, lead cards, and key UI elements are present.
 * Only change design-related code: layout, spacing, typography, colors, borders, radius, shadows, responsive behavior, component structure, and UI states.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { JobLeadCard } from "./JobLeadCard";
import { JobLeadsClient } from "./JobLeadsClient";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  })),
}));

vi.mock("@/services/provider/provider-job-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/provider/provider-job-service")>();
  return {
    ...actual,
    acceptLead: vi.fn(),
    declineLead: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_LEAD: ProviderLead = {
  id: "lead-1",
  clientName: "Client",
  serviceCategory: "Plumbing",
  title: "Burst pipe repair",
  inServiceArea: false,
  isDirect: false,
  description: "Burst pipe needs urgent repair in the kitchen.",
  location: "Chelsea, SW3",
  status: "new",
  budgetMinPence: 25000,
  budgetMaxPence: 40000,
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  expiresAt: new Date(Date.now() + 40 * 60 * 60 * 1000).toISOString(),
};

const MOCK_LEAD_2: ProviderLead = {
  id: "lead-2",
  clientName: "Client",
  serviceCategory: "Electrical",
  title: "Consumer unit replacement",
  inServiceArea: false,
  isDirect: false,
  description: "Consumer unit replacement required.",
  location: "Kensington",
  status: "new",
  budgetMinPence: 50000,
  budgetMaxPence: 80000,
  createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hrs ago
  expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
};

// ---------------------------------------------------------------------------
// JobLeadCard tests
// ---------------------------------------------------------------------------

describe("JobLeadCard", () => {
  it("renders service category as the card title", () => {
    render(
      <JobLeadCard
        lead={MOCK_LEAD}
        providerId="provider-1"
        onRemove={vi.fn()}
        variant="grid"
      />,
    );
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  it("renders Accept Lead button", () => {
    render(
      <JobLeadCard
        lead={MOCK_LEAD}
        providerId="provider-1"
        onRemove={vi.fn()}
        variant="grid"
      />,
    );
    expect(screen.getByRole("button", { name: /accept lead/i })).toBeInTheDocument();
  });

  it("renders hero variant with dismiss button", () => {
    render(
      <JobLeadCard
        lead={MOCK_LEAD}
        providerId="provider-1"
        onRemove={vi.fn()}
        variant="hero"
      />,
    );
    expect(screen.getByRole("button", { name: /dismiss lead/i })).toBeInTheDocument();
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  it("renders budget range in hero card", () => {
    render(
      <JobLeadCard
        lead={MOCK_LEAD}
        providerId="provider-1"
        onRemove={vi.fn()}
        variant="hero"
      />,
    );
    expect(screen.getByText(/£250/)).toBeInTheDocument();
  });

  it("renders location in grid card", () => {
    render(
      <JobLeadCard
        lead={MOCK_LEAD}
        providerId="provider-1"
        onRemove={vi.fn()}
        variant="grid"
      />,
    );
    expect(screen.getByText("Chelsea, SW3")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// JobLeadsClient tests
// ---------------------------------------------------------------------------

describe("JobLeadsClient", () => {
  it("renders the lead credits widget heading", () => {
    render(
      <JobLeadsClient initialLeads={[MOCK_LEAD]} providerId="provider-1" />,
    );
    expect(screen.getByText(/daily lead credits/i)).toBeInTheDocument();
  });

  it("renders market rank widget", () => {
    render(
      <JobLeadsClient initialLeads={[MOCK_LEAD]} providerId="provider-1" />,
    );
    expect(screen.getByText(/market rank/i)).toBeInTheDocument();
  });

  it("renders the first lead as a hero card with a dismiss button", () => {
    render(
      <JobLeadsClient initialLeads={[MOCK_LEAD]} providerId="provider-1" />,
    );
    expect(screen.getByRole("button", { name: /dismiss lead/i })).toBeInTheDocument();
  });

  it("renders second lead as a grid card without a dismiss button when two leads exist", () => {
    render(
      <JobLeadsClient
        initialLeads={[MOCK_LEAD, MOCK_LEAD_2]}
        providerId="provider-1"
      />,
    );
    // Only one dismiss button (for the hero card)
    expect(screen.getAllByRole("button", { name: /dismiss lead/i })).toHaveLength(1);
    // Second lead service category appears (may appear in filter tab + card)
    expect(screen.getAllByText("Electrical").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no leads match the current filter", () => {
    render(
      <JobLeadsClient initialLeads={[]} providerId="provider-1" />,
    );
    expect(screen.getByText(/no leads right now/i)).toBeInTheDocument();
  });

  it("does not render a non-functional 'load more' button (all leads load at once)", () => {
    render(
      <JobLeadsClient initialLeads={[MOCK_LEAD]} providerId="provider-1" />,
    );
    expect(
      screen.queryByRole("button", { name: /load more opportunities/i }),
    ).not.toBeInTheDocument();
  });
});
