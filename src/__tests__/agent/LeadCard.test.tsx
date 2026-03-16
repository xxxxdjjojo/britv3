/**
 * Test 12: LeadCard — isStale badge behaviour
 * - isStale=true when updated_at > 7 days ago -> amber "No contact 7d+" badge visible
 * - isStale=false when updated_at < 7 days ago -> badge NOT visible
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LeadCard } from "@/components/dashboard/agent/leads/LeadCard";
import type { AgentLead } from "@/types/agent";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue("/dashboard/agent/leads"),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock @dnd-kit/sortable
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: vi.fn().mockReturnValue({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

// Mock @dnd-kit/utilities
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn().mockReturnValue(""),
    },
  },
}));

const NOW = new Date("2026-03-16T12:00:00Z").getTime();

function makeLead(updatedAt: Date): AgentLead {
  return {
    id: "lead-001",
    agent_id: "agent-001",
    contact_name: "Bob Buyer",
    contact_email: "bob@example.com",
    contact_phone: null,
    property_id: null,
    stage: "new_enquiry",
    source: "website",
    assigned_to: null,
    notes: null,
    updated_at: updatedAt.toISOString(),
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("Test 12: LeadCard isStale badge", () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows 'No contact 7d+' badge when updated_at is 8 days ago", () => {
    const eightDaysAgo = new Date(NOW - 8 * 24 * 60 * 60 * 1000);
    const lead = makeLead(eightDaysAgo);

    render(<LeadCard lead={lead} />);

    expect(screen.getByText("No contact 7d+")).toBeDefined();
  });

  it("does NOT show stale badge when updated_at is yesterday", () => {
    const yesterday = new Date(NOW - 1 * 24 * 60 * 60 * 1000);
    const lead = makeLead(yesterday);

    render(<LeadCard lead={lead} />);

    const badge = screen.queryByText("No contact 7d+");
    expect(badge).toBeNull();
  });

  it("shows badge when updated_at is exactly 8 days ago (> 7 day threshold)", () => {
    const eightDaysAgo = new Date(NOW - 8 * 24 * 60 * 60 * 1000);
    const lead = makeLead(eightDaysAgo);

    render(<LeadCard lead={lead} />);

    expect(screen.getByText("No contact 7d+")).toBeDefined();
  });

  it("does NOT show badge when updated_at is 6 days ago (under threshold)", () => {
    const sixDaysAgo = new Date(NOW - 6 * 24 * 60 * 60 * 1000);
    const lead = makeLead(sixDaysAgo);

    render(<LeadCard lead={lead} />);

    expect(screen.queryByText("No contact 7d+")).toBeNull();
  });
});
