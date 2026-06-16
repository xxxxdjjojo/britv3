/**
 * Design-parity render tests for TeamMemberList and BranchManager.
 * Only change design-related code: layout, spacing, typography, colors,
 * borders, radius, shadows, responsive behavior, component structure, and UI states.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { AgentTeamMember, AgentBranch } from "@/types/agent";
import { TeamMemberList } from "./TeamMemberList";
import { BranchManager } from "./BranchManager";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_MEMBER: AgentTeamMember = {
  id: "member-1",
  agent_id: "agent-1",
  user_id: "user-1",
  branch_id: "branch-1",
  role: "negotiator",
  status: "active",
  email: "sarah@example.com",
  name: "Sarah Jenkins",
  invited_at: "2024-01-01T00:00:00Z",
  joined_at: "2024-01-02T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
};

const MOCK_BRANCH: AgentBranch = {
  id: "branch-1",
  agent_id: "agent-1",
  name: "London Central",
  address_line_1: "10 Fleet Street",
  address_line_2: null,
  city: "London",
  postcode: "EC4A 2AB",
  phone: "020 7946 0958",
  email: "london@agency.co.uk",
  is_head_office: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// TeamMemberList
// ---------------------------------------------------------------------------

describe("TeamMemberList", () => {
  it("renders the page heading", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByRole("heading", { name: /team members/i })).toBeInTheDocument();
  });

  it("renders the Branch Personnel section title", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByText("Branch Personnel")).toBeInTheDocument();
  });

  it("renders the active members badge", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    // Badge shows "N Active Members" in the Branch Personnel header
    expect(screen.getAllByText(/active members/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the member name in the table", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
  });

  it("renders the member email", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByText("sarah@example.com")).toBeInTheDocument();
  });

  it("renders role badge for the member", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    // "Negotiator" appears both in the filter select option and the role badge
    const all = screen.getAllByText("Negotiator");
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Role Permissions Matrix section", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByText("Role Permissions Matrix")).toBeInTheDocument();
  });

  it("renders the Invite Member sidebar card title", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByText("Invite Member")).toBeInTheDocument();
  });

  it("renders Active Members summary card", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getAllByText(/active members/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state when no members match filter", () => {
    render(<TeamMemberList members={[]} branches={[]} />);
    expect(screen.getByText("No team members found.")).toBeInTheDocument();
  });

  it("renders table column headers", () => {
    render(<TeamMemberList members={[MOCK_MEMBER]} branches={[MOCK_BRANCH]} />);
    expect(screen.getByText("Team Member")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BranchManager
// ---------------------------------------------------------------------------

describe("BranchManager", () => {
  it("renders the page heading", () => {
    render(<BranchManager branches={[MOCK_BRANCH]} members={[MOCK_MEMBER]} />);
    expect(screen.getByRole("heading", { name: /branch management/i })).toBeInTheDocument();
  });

  it("renders branch name", () => {
    render(<BranchManager branches={[MOCK_BRANCH]} members={[MOCK_MEMBER]} />);
    expect(screen.getByText("London Central")).toBeInTheDocument();
  });

  it("renders Head Office badge for head office branch", () => {
    render(<BranchManager branches={[MOCK_BRANCH]} members={[MOCK_MEMBER]} />);
    expect(screen.getByText("Head Office")).toBeInTheDocument();
  });

  it("renders branch address", () => {
    render(<BranchManager branches={[MOCK_BRANCH]} members={[MOCK_MEMBER]} />);
    expect(screen.getByText(/10 Fleet Street/)).toBeInTheDocument();
  });

  it("renders Add Branch button", () => {
    render(<BranchManager branches={[]} members={[]} />);
    expect(screen.getByRole("button", { name: /add branch/i })).toBeInTheDocument();
  });

  it("renders empty state when no branches", () => {
    render(<BranchManager branches={[]} members={[]} />);
    expect(screen.getByText("No branches yet")).toBeInTheDocument();
  });

  it("shows member count for branch", () => {
    render(<BranchManager branches={[MOCK_BRANCH]} members={[MOCK_MEMBER]} />);
    expect(screen.getByText(/1 member/)).toBeInTheDocument();
  });
});
