/**
 * Design-parity render tests for LeadDetailTimeline.
 * Verifies contact info, pipeline controls, timeline, and action buttons render.
 * Only change design-related code: layout, spacing, typography, colors, borders,
 * radius, shadows, responsive behavior, component structure, and UI states.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { AgentLead, AgentLeadActivity, AgentTeamMember } from "@/types/agent";
import { LeadDetailTimeline } from "./LeadDetailTimeline";

// ---------------------------------------------------------------------------
// Mocks — prevent real fetch / Next.js routing in JSDOM
// ---------------------------------------------------------------------------

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_LEAD: AgentLead = {
  id: "lead-abc",
  agent_id: "agent-1",
  property_id: null,
  contact_name: "Sarah Jenkins",
  contact_email: "sarah@example.com",
  contact_phone: "+44 7700 900123",
  stage: "qualified",
  source: "portal",
  assigned_to: "member-1",
  notes: null,
  created_at: "2024-03-01T10:00:00Z",
  updated_at: "2024-03-01T10:00:00Z",
};

const MOCK_ACTIVITY: AgentLeadActivity = {
  id: "act-1",
  lead_id: "lead-abc",
  actor_id: "user-me",
  activity_type: "note_added",
  description: "Discussed budget with client",
  metadata: null,
  created_at: "2024-03-02T09:30:00Z",
};

const MOCK_TEAM_MEMBERS: AgentTeamMember[] = [
  {
    id: "tm-1",
    agent_id: "agent-1",
    user_id: "member-1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "negotiator",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LeadDetailTimeline", () => {
  it("renders contact email in the contact information panel", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("sarah@example.com")).toBeInTheDocument();
  });

  it("renders contact phone in the contact information panel", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("+44 7700 900123")).toBeInTheDocument();
  });

  it("renders Activity Timeline heading", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("Activity Timeline")).toBeInTheDocument();
  });

  it("shows empty state when there are no activities", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("renders an activity entry description", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[MOCK_ACTIVITY]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("Discussed budget with client")).toBeInTheDocument();
  });

  it("labels the actor as 'You' when the activity actor matches userId", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[MOCK_ACTIVITY]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("renders the Add Note button", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByRole("button", { name: /add note/i })).toBeInTheDocument();
  });

  it("renders Send Email action button when email is present", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByRole("link", { name: /send email/i })).toBeInTheDocument();
  });

  it("renders Book Viewing action button", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByRole("link", { name: /book viewing/i })).toBeInTheDocument();
  });

  it("renders the stage badge in Lead Status panel", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.getByText("Qualified")).toBeInTheDocument();
  });

  it("renders team member name when matched by assigned_to", () => {
    render(
      <LeadDetailTimeline
        lead={MOCK_LEAD}
        activities={[]}
        teamMembers={MOCK_TEAM_MEMBERS}
        userId="user-me"
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("does not render Send Email button when email is absent", () => {
    const leadNoEmail: AgentLead = { ...MOCK_LEAD, contact_email: null };
    render(
      <LeadDetailTimeline
        lead={leadNoEmail}
        activities={[]}
        teamMembers={[]}
        userId="user-me"
      />,
    );
    expect(screen.queryByRole("link", { name: /send email/i })).not.toBeInTheDocument();
  });
});
