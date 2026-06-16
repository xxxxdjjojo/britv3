/**
 * Design-parity render tests for LeadCard and LeadPipelineKanban.
 * Only change design-related code: layout, spacing, typography, colors,
 * borders, radius, shadows, responsive behavior, component structure, and UI states.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { AgentLead } from "@/types/agent";
import { LeadCard } from "./LeadCard";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const MOCK_LEAD: AgentLead = {
  id: "lead-abc",
  agent_id: "agent-1",
  property_id: null,
  contact_name: "James Whittaker",
  contact_email: "james@example.com",
  contact_phone: null,
  stage: "offer_made",
  source: "website",
  assigned_to: null,
  notes: null,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 h ago
  updated_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LeadCard", () => {
  it("renders contact name", () => {
    render(
      <LeadCard
        lead={MOCK_LEAD}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.getByText("James Whittaker")).toBeInTheDocument();
  });

  it("renders contact email when present", () => {
    render(
      <LeadCard
        lead={MOCK_LEAD}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.getByText("james@example.com")).toBeInTheDocument();
  });

  it("renders initials avatar", () => {
    render(
      <LeadCard
        lead={MOCK_LEAD}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.getByText("JW")).toBeInTheDocument();
  });

  it("renders stage label", () => {
    render(
      <LeadCard
        lead={MOCK_LEAD}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.getByText("Offer Made")).toBeInTheDocument();
  });

  it("renders relative time", () => {
    render(
      <LeadCard
        lead={MOCK_LEAD}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("links to the lead detail page", () => {
    render(
      <LeadCard
        lead={MOCK_LEAD}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/agent/leads/lead-abc");
  });

  it("shows unassigned when assigned_to is null", () => {
    render(
      <LeadCard
        lead={{ ...MOCK_LEAD, assigned_to: null }}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("omits email when not present", () => {
    render(
      <LeadCard
        lead={{ ...MOCK_LEAD, contact_email: null }}
        stageLabel="Offer Made"
        stageDot="bg-success"
        stageBadge="bg-success/10 text-success"
        relativeTime="2 hours ago"
        initials="JW"
      />,
    );
    expect(screen.queryByText("james@example.com")).not.toBeInTheDocument();
  });
});
